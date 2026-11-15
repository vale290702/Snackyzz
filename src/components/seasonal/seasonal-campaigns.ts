import type { SeasonalTheme } from "../../../supabase/functions/_shared/seasonal-theme";
interface Campaign {
  headline: string;
  emphasis: string;
  description: string;
  cta: string;
  footnote: string;
  announcement: string;
  announcementEnd: string;
  ribbon: readonly [string, string];
  productsTitle: string;
  productsDescription: string;
  shopDescription: string;
  breakTitle: string;
  breakEmphasis: string;
  breakDescription: string;
  breakCta: string;
  footer: readonly [string, string];
  image: string;
  imageAlt: string;
}
export const seasonalCampaigns: Record<SeasonalTheme, Campaign> = {
  original: {
    headline: "Caer en el antojo\nnunca supo",
    emphasis: "tan bien.",
    description:
      "Para ese “algo dulce”, para compartir.\nO para quedártelas todas. Tú decides.",
    cta: "Encuentra tu cookie",
    footnote: "Tu próximo break empieza aquí.",
    announcement: "Un pequeño break. Un gran antojo.",
    announcementEnd: "Eso es Snackyzz.",
    ribbon: ["UN BOCADO MÁS", "JUST ONE MORE"],
    productsTitle: "Elige tu debilidad.",
    productsDescription: "Muchas cookies. Ninguna decisión equivocada",
    shopDescription:
      "Cookies Snackyzz selladas, listas para acompañar tu próximo break.",
    breakTitle: "El día pide",
    breakEmphasis: "un snacky break.",
    breakDescription:
      "Entre un pendiente y otro, siempre hay espacio para algo rico. Haz una pausa. Elige tu favorita. Disfruta el momento.",
    breakCta: "Arma tu pedido",
    footer: ["La vida se disfruta", "un bocado a la vez."],
    image: "/assets/hero-cookies.webp",
    imageAlt: "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, sobre un fondo naranja.",
  },
  valentines: {
    headline: "Amor a primera",
    emphasis: "mordida.",
    description:
      "Para tu persona favorita. Para compartir.\nO para darte ese gusto que también mereces.",
    cta: "Encuentra tu dulce detalle",
    footnote: "Los pequeños detalles también se saborean.",
    announcement: "Un detalle dulce dice mucho.",
    announcementEnd: "Compártelo con Snackyzz.",
    ribbon: ["AMOR A PRIMERA MORDIDA", "UN DULCE DETALLE"],
    productsTitle: "Un detalle para enamorarse.",
    productsDescription: "Elige el antojo que quieres compartir.",
    shopDescription:
      "Un detalle dulce para regalar, compartir o disfrutar a tu manera.",
    breakTitle: "Hay detalles que dicen",
    breakEmphasis: "quédate un ratito.",
    breakDescription:
      "Una cookie, una buena conversación y tu persona favorita. A veces, el mejor plan cabe en un pequeño break.",
    breakCta: "Elige un detalle dulce",
    footer: ["El cariño se comparte", "un bocado a la vez."],
    image: "/assets/seasons/valentines.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, en una escena de San Valentín con tonos rosa y pétalos.",
  },
  easter: {
    headline: "Un antojo que",
    emphasis: "florece.",
    description:
      "Días para reunirse, colores para sonreír\ny algo dulce para poner en el centro.",
    cta: "Descubre tu antojo de Pascua",
    footnote: "Las pequeñas alegrías se comparten.",
    announcement: "Una pausa dulce para esta Pascua.",
    announcementEnd: "Disfrútala con Snackyzz.",
    ribbon: ["UN ANTOJO QUE FLORECE", "PEQUEÑAS ALEGRÍAS"],
    productsTitle: "Pequeñas alegrías para elegir.",
    productsDescription: "Un toque dulce para tu encuentro de Pascua.",
    shopDescription:
      "Cookies para acompañar los encuentros y las pequeñas alegrías de Pascua.",
    breakTitle: "Entre colores y sonrisas,",
    breakEmphasis: "un dulce break.",
    breakDescription:
      "Haz espacio para sentarte, compartir y disfrutar el momento. Las pequeñas alegrías también merecen su pausa.",
    breakCta: "Elige algo para compartir",
    footer: ["Que florezcan los encuentros", "y los pequeños antojos."],
    image: "/assets/seasons/easter.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, en una escena de Pascua con huevos decorativos y flores.",
  },
  halloween: {
    headline: "Caer en la tentación",
    emphasis: "da gusto.",
    description:
      "Un plan de película, una noche entre amigos\ny ese antojo que aparece cuando menos lo esperas.",
    cta: "Cae en la tentación",
    footnote: "El único susto: querer otra.",
    announcement: "Esta noche, deja entrar al antojo.",
    announcementEnd: "Halloween con Snackyzz.",
    ribbon: ["DULCE TENTACIÓN", "UN ANTOJO DE MIEDO"],
    productsTitle: "Antojos que dan gusto.",
    productsDescription: "Elige tu compañía para una noche de Halloween.",
    shopDescription:
      "Cookies para tus planes de Halloween. Que el único susto sea querer otra.",
    breakTitle: "La noche pide",
    breakEmphasis: "algo de tentación.",
    breakDescription:
      "Prepara la película, reúne a tus favoritos y deja un espacio para las cookies. Hoy el antojo también está invitado.",
    breakCta: "Prepara tu plan dulce",
    footer: ["Una noche para compartir.", "Una cookie más, por si acaso."],
    image: "/assets/seasons/halloween.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, en una escena de Halloween con calabazas y tonos ciruela.",
  },
  thanksgiving: {
    headline: "Gracias por compartir",
    emphasis: "el antojo.",
    description:
      "Por las sobremesas largas y los pequeños encuentros.\nPor quienes siempre dejan espacio para algo dulce.",
    cta: "Lleva algo para compartir",
    footnote: "Los mejores momentos tienen buena compañía.",
    announcement: "Hay mucho que agradecer y algo dulce que compartir.",
    announcementEnd: "Snackyzz en tu mesa.",
    ribbon: ["GRACIAS POR COMPARTIR", "UN MOMENTO MÁS"],
    productsTitle: "Algo dulce para la mesa.",
    productsDescription: "Elige un antojo para seguir compartiendo.",
    shopDescription:
      "Un detalle dulce para agradecer, reunirse y alargar la sobremesa.",
    breakTitle: "Que la sobremesa dure",
    breakEmphasis: "un poquito más.",
    breakDescription:
      "Una conversación que sigue, una silla más en la mesa y cookies para compartir. Gracias por hacer de lo pequeño un buen momento.",
    breakCta: "Elige para tu mesa",
    footer: ["Gracias por los encuentros.", "Y por compartir el antojo."],
    image: "/assets/seasons/thanksgiving.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, en una escena de otoño con hojas, trigo y tonos cobre.",
  },
  christmas: {
    headline: "La Navidad sabe mejor",
    emphasis: "compartida.",
    description:
      "Para las visitas inesperadas, los pequeños regalos\ny las sobremesas que no quieres que terminen.",
    cta: "Comparte un antojo navideño",
    footnote: "Haz espacio para un momento dulce.",
    announcement: "Esta Navidad, comparte un pequeño gran antojo.",
    announcementEnd: "Compártelo con Snackyzz.",
    ribbon: ["NAVIDAD PARA COMPARTIR", "UN MOMENTO DULCE"],
    productsTitle: "Un antojo para cada encuentro.",
    productsDescription: "Algo dulce para compartir esta Navidad.",
    shopDescription:
      "Cookies para acompañar tus encuentros, detalles y sobremesas navideñas.",
    breakTitle: "El mejor regalo es",
    breakEmphasis: "un ratito juntos.",
    breakDescription:
      "Baja el ritmo, acerca las sillas y comparte algo dulce. La Navidad también vive en esos pequeños momentos que saben a estar en casa.",
    breakCta: "Elige para compartir",
    footer: ["Que sobren los encuentros", "y los momentos dulces."],
    image: "/assets/seasons/christmas.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, junto a un árbol de Navidad y detalles de pino y dorado.",
  },
  "new-year": {
    headline: "Nuevos comienzos.",
    emphasis: "El mismo antojo.",
    description:
      "Por los planes que vienen y los momentos que se quedan.\nEmpecemos con algo dulce.",
    cta: "Empieza con un dulce antojo",
    footnote: "Un buen comienzo se disfruta sin prisa.",
    announcement: "Nuevos planes. Pequeños breaks. Grandes antojos.",
    announcementEnd: "Celebra con Snackyzz.",
    ribbon: ["POR LOS NUEVOS COMIENZOS", "EL MISMO ANTOJO"],
    productsTitle: "Empieza por tu favorita.",
    productsDescription: "Un detalle dulce para celebrar lo que viene.",
    shopDescription:
      "Cookies para celebrar nuevos comienzos y seguir compartiendo tus momentos favoritos.",
    breakTitle: "Brindemos por",
    breakEmphasis: "los pequeños momentos.",
    breakDescription:
      "Por los encuentros, las nuevas historias y los breaks que hacen bien. Que nunca falte algo dulce para compartir en el camino.",
    breakCta: "Elige tu primer antojo",
    footer: ["Por nuevos comienzos", "y más momentos juntos."],
    image: "/assets/seasons/new-year.webp",
    imageAlt:
      "Mini cookies bañadas en chocolate blanco, con y sin sprinkles, en una escena de Año Nuevo con detalles y confeti dorados.",
  },
};
