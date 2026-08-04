import { DialogVariant, DialogVariantConfig } from '../models/dialog.model';
import { ToastType } from '../models/toast.model';

export const DEFAULT_TOAST_DURATION = 4500;

export const TOAST_ICON_BY_TYPE: Record<ToastType, string> = {
  success: 'fa-solid fa-check',
  info: 'fa-solid fa-circle-info',
  warning: 'fa-solid fa-triangle-exclamation',
  error: 'fa-solid fa-xmark',
};

export const DIALOG_VARIANT_CONFIG: Record<DialogVariant, DialogVariantConfig> = {
  default: {
    icon: 'fa-solid fa-circle-question',
    toneClass: 'feedback-tone-default',
    buttonClass: 'btn-checkmate-primary',
  },
  info: {
    icon: 'fa-solid fa-circle-info',
    toneClass: 'feedback-tone-info',
    buttonClass: 'btn-checkmate-info',
  },
  warning: {
    icon: 'fa-solid fa-triangle-exclamation',
    toneClass: 'feedback-tone-warning',
    buttonClass: 'btn-checkmate-warning',
  },
  danger: {
    icon: 'fa-solid fa-trash-can',
    toneClass: 'feedback-tone-danger',
    buttonClass: 'btn-checkmate-danger',
  },
  success: {
    icon: 'fa-solid fa-check',
    toneClass: 'feedback-tone-success',
    buttonClass: 'btn-checkmate-success',
  },
};
