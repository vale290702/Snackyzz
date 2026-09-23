import { cors, errorResponse, json, serviceClient } from "../_shared/http.ts";
import { InputError } from "../_shared/validation.ts";

function clean(value: unknown, max: number, min = 0) {
  const result = String(value ?? "").trim();
  if (result.length < min || result.length > max || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(result)) throw new InputError("Revisa los datos ingresados.");
  return result;
}
const days = ["mon","tue","wed","thu","fri","sat","sun"];
function deliverySchedule(value: unknown) {
  if (!value || typeof value !== "object") throw new InputError("Revisa el horario de entregas.");
  return Object.fromEntries(days.map((day) => {
    const item = (value as Record<string,Record<string,unknown>>)[day] ?? {};
    const start = String(item.start ?? ""), end = String(item.end ?? "");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) || start >= end) throw new InputError("Revisa las horas del horario de entregas.");
    return [day,{enabled:Boolean(item.enabled),start,end}];
  }));
}
async function authorize(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new InputError("Inicia sesión para configurar la tienda.",401);
  const db = serviceClient();
  const {data:userData,error:authError}=await db.auth.getUser(token);
  if(authError||!userData.user) throw new InputError("La sesión venció. Vuelve a iniciar sesión.",401);
  const {data:admin,error}=await db.from("admin_users").select("user_id").eq("user_id",userData.user.id).maybeSingle();
  if(error) throw new InputError("No se pudieron verificar tus permisos.",503);
  if(!admin) throw new InputError("Esta cuenta no tiene acceso de administración.",403);
  return db;
}
Deno.serve(async(request:Request)=>{
  let headers:Record<string,string>={};
  try{
    headers=cors(request);
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers});
    if(!["GET","POST"].includes(request.method)) throw new InputError("Método no permitido.",405);
    const db=await authorize(request);
    if(request.method==="GET"){
      const [settings,locations]=await Promise.all([
        db.from("store_settings").select("*").eq("id",1).single(),
        db.from("sales_points").select("*").order("position").order("name"),
      ]);
      if(settings.error||locations.error) throw new InputError("No se pudo cargar la configuración.",503);
      return json({settings:settings.data,locations:locations.data,emailConfigured:Boolean(Deno.env.get("RESEND_API_KEY")&&Deno.env.get("FROM_EMAIL"))},200,headers);
    }
    const body=await request.json();
    if(body.action==="save-settings"){
      const values={
        sinpe_number:clean(body.sinpeNumber,30),sinpe_recipient:clean(body.sinpeRecipient,100),
        whatsapp:clean(body.whatsapp,30),public_email:clean(body.publicEmail,254),instagram:clean(body.instagram,80),
        uber_delivery_enabled:Boolean(body.uberDeliveryEnabled),uber_disclaimer:clean(body.uberDisclaimer,300,10),
        delivery_lead_hours:Number(body.deliveryLeadHours),delivery_slot_hours:Number(body.deliverySlotHours),delivery_schedule:deliverySchedule(body.deliverySchedule),
      };
      if(!Number.isInteger(values.delivery_lead_hours)||values.delivery_lead_hours<0||values.delivery_lead_hours>168||!Number.isInteger(values.delivery_slot_hours)||values.delivery_slot_hours<1||values.delivery_slot_hours>12) throw new InputError("Revisa la anticipación y duración de los horarios.");
      if(values.public_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.public_email)) throw new InputError("Revisa el correo público.");
      if(values.whatsapp&&!/^\+?[0-9\s-]{8,30}$/.test(values.whatsapp)) throw new InputError("Revisa el número de WhatsApp.");
      const {data,error}=await db.from("store_settings").update(values).eq("id",1).select().single();
      if(error) throw new InputError("No se pudo guardar la configuración.",503);
      return json({settings:data},200,headers);
    }
    if(body.action==="save-location"){
      const values={name:clean(body.name,100,2),city:clean(body.city,100,2),address:clean(body.address,300,5),hours:clean(body.hours,200),map_url:clean(body.mapUrl,500),position:Number(body.position),active:true};
      if(!Number.isInteger(values.position)||values.position<0||values.position>999) throw new InputError("Revisa la posición.");
      if(values.map_url&&!/^https:\/\/(www\.)?google\.[^/]+\/maps|^https:\/\/maps\.app\.goo\.gl\//i.test(values.map_url)) throw new InputError("Usa un enlace válido de Google Maps.");
      const query=body.id?db.from("sales_points").update(values).eq("id",body.id):db.from("sales_points").insert(values);
      const {data,error}=await query.select().single();
      if(error) throw new InputError("No se pudo guardar el punto de venta.",503);
      return json({location:data},body.id?200:201,headers);
    }
    if(["archive-location","restore-location"].includes(body.action)&&/^[0-9a-f-]{36}$/i.test(body.id??"")){
      const {data,error}=await db.from("sales_points").update({active:body.action==="restore-location"}).eq("id",body.id).select().single();
      if(error) throw new InputError("No se pudo actualizar el punto de venta.",503);
      return json({location:data},200,headers);
    }
    throw new InputError("Acción inválida.");
  }catch(error){return errorResponse(error,headers);}
});
