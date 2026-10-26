import { EventJob, EventJobStatus, runEventConsumers } from "@/features/events";

export async function POST(request: Request): Promise<Response> {
  if (!EventJob.isAuthorized(request)) {
    return new Response(null, { status: EventJobStatus.Unauthorized });
  }

  const result = await runEventConsumers([]);
  if (!result.ok) {
    return new Response(null, { status: EventJobStatus.Unavailable });
  }

  return Response.json(result.value, {
    status: result.value.failed > 0 ? EventJobStatus.Unavailable : EventJobStatus.Ok,
  });
}
