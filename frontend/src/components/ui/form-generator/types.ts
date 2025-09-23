import { ReactNode } from "react";

export interface FormFieldOption {
  name: string;
  value: any;
  description?: string;
}

export interface FormFieldConfig {
  name: string;
  displayName: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "options"
    | "multiOptions"
    | "json"
    | "dateTime"
    | "textarea"
    | "password"
    | "email"
    | "url"
    | "switch"
    | "custom";
  required?: boolean;
  default?: any;
  description?: string;
  placeholder?: string;
  options?: FormFieldOption[];
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  disabled?: boolean;
  readonly?: boolean;
  rows?: number; // for textarea
  step?: number; // for number inputs
  customComponent?: (props: CustomFieldProps) => ReactNode;
}

export interface CustomFieldProps {
  value: any;
  onChange: (value: any) => void;
  field: FormFieldConfig;
  error?: string;
  disabled?: boolean;
}

export interface FormGeneratorProps {
  fields: FormFieldConfig[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onFieldBlur?: (name: string, value: any) => void;
  disabled?: boolean;
  className?: string;
  fieldClassName?: string;
  showRequiredIndicator?: boolean;
  requiredIndicator?: ReactNode;
}

export interface FieldVisibilityOptions {
  show?: Record<string, any[]>;
  hide?: Record<string, any[]>;
}

export interface FormFieldRendererProps {
  field: FormFieldConfig;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: (value: any) => void;
  disabled?: boolean;
  allValues: Record<string, any>;
  allFields: FormFieldConfig[];
}
