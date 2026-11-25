export declare enum InputType {
    Select = "select",
    NestedSelect = "nested-select",
    MultipleSelect = "multiple-select",
    MultipleNestedSelect = "multiple-nested-select",
    Number = "number",
    Boolean = "boolean",
    Text = "text",
    MultipleText = "multiple-text",
    Posture3D = "posture-3d"
}
export type InputSpecification = InputBooleanSpecification | InputSelectSpecification | InputNestedSelectSpecification | InputMultipleSelectSpecification | InputMultipleNestedSelectSpecification | InputNumberSpecification | InputTextSpecification | InputMultipleTextSpecification | InputPosture3DSpecification;
export type InputBooleanSpecification = {
    type: InputType.Boolean;
    default?: boolean;
};
export type InputSelectOption = {
    label: string;
    value: string;
    color?: string;
};
export type InputSelectOptionOrString = InputSelectOption | string;
export type InputNestedSelectOption = InputSelectOption & {
    children?: InputNestedSelectOption[];
};
export declare enum SelectionWidgetType {
    Dropdown = "Dropdown",
    Segment = "Segment"
}
export declare enum SelectionColorType {
    Random = "Random",
    Custom = "Custom"
}
export type Posture3DAxis = {
    roll: number;
    pitch: number;
    yaw: number;
};
export type RenderConfig = {
    selectionWidgetType?: SelectionWidgetType;
    selectionColorType?: SelectionColorType;
};
export type InputSelectSpecification = {
    type: InputType.Select;
    items: Array<InputSelectOptionOrString>;
    default?: string;
    allowArbitraryInput?: boolean;
    continuousFrameSync?: boolean;
    renderConfig?: RenderConfig;
};
export type InputNestedSelectSpecification = {
    type: InputType.NestedSelect;
    items: InputNestedSelectOption[];
    default?: string[];
    continuousFrameSync?: boolean;
    renderConfig?: RenderConfig;
};
export type InputMultipleSelectSpecification = {
    type: InputType.MultipleSelect;
    items: InputSelectOptionOrString[];
    default?: string[];
    allowArbitraryInput?: boolean;
    continuousFrameSync?: boolean;
    renderConfig?: RenderConfig;
    minInput?: number;
    maxInput?: number;
};
export type InputMultipleNestedSelectSpecification = {
    type: InputType.MultipleNestedSelect;
    items: InputNestedSelectOption[];
    default?: string[];
    allowArbitraryInput?: boolean;
    continuousFrameSync?: boolean;
    renderConfig?: RenderConfig;
    minInput?: number;
    maxInput?: number;
};
export type InputNumberSpecification = {
    type: InputType.Number;
    min?: number;
    max?: number;
    step?: number;
    default?: number;
    continuousFrameSync?: boolean;
};
export type InputTextSpecification = {
    type: InputType.Text;
    apiAutoCompleteUrl?: string;
    default?: string;
    continuousFrameSync?: boolean;
    latex?: boolean;
    smiles?: boolean;
    format?: 'text' | 'latex' | 'smiles' | 'markdown' | 'json';
    regex?: string;
    minLength?: number;
    maxLength?: number;
};
export type InputMultipleTextSpecification = {
    type: InputType.MultipleText;
    apiAutoCompleteUrl?: string;
    default?: string[];
    regex?: string;
    maxLength?: number;
    continuousFrameSync?: boolean;
};
export type InputPosture3DSpecification = {
    type: InputType.Posture3D;
    default?: Posture3DAxis;
    posture3DUrl?: string;
    stepPrecision?: number;
};
