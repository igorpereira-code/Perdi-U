export type ActivationAction = {
  label: string;
  loadingText: string;
  /** The active state the item will have after the action. */
  newActive: boolean;
};

/** The button to deactivate an active item, or to activate it again. */
export function getActivationAction(active: boolean): ActivationAction {
  return active
    ? { label: 'Desactivar', loadingText: 'Desactivando…', newActive: false }
    : { label: 'Activar', loadingText: 'Activando…', newActive: true };
}
