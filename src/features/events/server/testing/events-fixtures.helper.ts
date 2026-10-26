import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

/**
 * Test-only owner SQL boundary: API roles intentionally cannot publish fixtures.
 */
export class EventFixtures {
  private constructor() {}

  /**
   * Publishes an immutable synthetic event as the database owner.
   * @returns The published event id.
   */
  static publish(): string {
    const sql = `select private.publish_event(
      'order.placed', 1, 'order', '${randomUUID()}',
      '{"number":"SN-TEST","secret":"payload-must-not-be-logged"}', 'system'
    );`;

    return execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_snackyzz-rework",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
      ],
      { encoding: "utf8", timeout: 10_000 },
    ).trim();
  }

  /**
   * Isolates one consumer by acknowledging historical events outside its fixture.
   * @param eventId The only event left pending for this test.
   * @returns A stable name for one test's consumer.
   */
  static consumer(eventId: string): string {
    const consumer = `events_test_${randomUUID()}`;
    const sql = `select events.record_receipt('${consumer}', id, 'processed')
      from events.domain_events where id <> '${eventId}';`;

    execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_snackyzz-rework",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql,
      ],
      { encoding: "utf8", timeout: 10_000 },
    );

    return consumer;
  }
}
