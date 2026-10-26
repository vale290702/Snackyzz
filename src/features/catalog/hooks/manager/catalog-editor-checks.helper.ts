import type { RefObject } from "react";

/**
 * Reads form submissions rather than DOM changes so controlled and hidden fields are protected.
 */
export class CatalogEditorChecks {
  private baselines = new WeakMap<HTMLFormElement, string>();

  constructor(private readonly body: RefObject<HTMLDivElement | null>) {}

  private forms(): HTMLFormElement[] {
    return Array.from(this.body.current?.querySelectorAll("form") ?? []);
  }

  private snapshot(form: HTMLFormElement): string {
    return JSON.stringify(
      Array.from(new FormData(form).entries())
        .filter(([, value]) => typeof value === "string")
        .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
          `${leftKey}:${leftValue}`.localeCompare(`${rightKey}:${rightValue}`),
        ),
    );
  }

  /**
   * Records new forms before their first interaction without overwriting existing baselines.
   */
  remember = (): void => {
    for (const form of this.forms()) {
      if (!this.baselines.has(form)) this.baselines.set(form, this.snapshot(form));
    }
  };

  /**
   * Compares every mounted form with its original submitted values.
   * @returns Whether closing would discard changed fields.
   */
  hasChanges = (): boolean =>
    this.forms().some((form) => {
      if (form.closest("fieldset:disabled")) return false;
      const baseline = this.baselines.get(form);
      return baseline !== undefined && baseline !== this.snapshot(form);
    });

  /**
   * Checks whether any form is saving or uploading.
   * @returns True while a write must finish before leaving.
   */
  isBusy = (): boolean => Boolean(this.body.current?.querySelector('[aria-busy="true"]'));

  /**
   * Accepts the current values after an explicitly successful save.
   */
  accept = (): void => {
    for (const form of this.forms()) this.baselines.set(form, this.snapshot(form));
  };

  /**
   * Clears saved forms so refreshed presentation fields establish their next baseline on focus.
   */
  reset = (): void => {
    this.baselines = new WeakMap();
  };
}
