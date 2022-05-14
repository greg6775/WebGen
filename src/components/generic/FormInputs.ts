import { accessibilityButton, accessibilityDisableTabOnDisabled } from "../../lib/Accessibility.ts";
import { Color } from "../../lib/Color.ts";
import { ButtonStyle, ColoredComponent } from "../../types.ts";
import { createElement } from "../Components.ts";
import { changeClassAtIndex } from "../Helper.ts";
import { loadingWheel } from "../light-components/loadingWheel.ts";
import { CommonIcon, CommonIconType, Icon } from "./Icon.ts";

const speicalSyles = [ ButtonStyle.Spinner, ButtonStyle.Progress ];

export abstract class InputForm<Type> extends ColoredComponent {
    protected formData: FormData | null = null;
    protected key: string | null = null;

    setValue(value: Type) {
        this.dispatchEvent(new CustomEvent<Type>("update", { detail: value }));
        return this;
    }
    abstract saveData(data: Type): string | Blob
    abstract parseData(data: FormDataEntryValue): Type

    syncFormData(formData: FormData, key: string) {
        this.formData = formData;
        this.key = key;
        if (formData.has(key))
            this.setValue(this.parseData(formData.get(key)!));
        return this;
    }
}

export class DropDownInputComponent<Value extends [ value: string, index: number ]> extends InputForm<Value> {
    prog = createElement("div")
    text = createElement("span")
    #dropdown: string[];
    constructor(dropdown: string[], label: string) {
        super();
        this.#dropdown = dropdown;
        this.wrapper.tabIndex = speicalSyles.includes(ButtonStyle.Normal) ? -1 : accessibilityDisableTabOnDisabled();
        this.wrapper.classList.add("wbutton", Color.Grayscaled, ButtonStyle.Normal)
        this.wrapper.append(loadingWheel());
        this.wrapper.onkeydown = accessibilityButton(this.wrapper)
        this.text.innerText = label;
        this.wrapper.append(this.text);
        this.addEventListener("update", (event) => {
            const [ value ] = (<CustomEvent<Value>>event).detail;
            this.text.innerText = value;
            if (this.formData && this.key)
                this.formData.set(this.key, this.saveData((<CustomEvent>event).detail))

        })
        this.wrapper.classList.add("isList")
        this.wrapper.addEventListener("click", () => {
            if (this.wrapper.classList.contains(Color.Disabled)) return;
            if (dropdown) this.wrapper.querySelector('ul')?.classList.toggle("open");
        })
        const list = createElement("ul")
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target as Node)) {
                list.classList.remove('open');
            }
        })
        dropdown.forEach((displayName, index) => {
            const entry = createElement("a")
            entry.tabIndex = 0;
            entry.onkeydown = accessibilityButton(entry);
            entry.innerText = displayName;
            entry.onclick = () => this.setValue([ displayName, index ] as Value);
            list.append(entry)
        })
        const iconContainer = createElement("div")
        iconContainer.classList.add("icon-suffix")
        iconContainer.append(Icon(CommonIcon(CommonIconType.ArrowDown)).draw())
        this.wrapper.append(list, iconContainer)
    }
    setStyle(style: ButtonStyle, progress?: number) {
        this.wrapper.tabIndex = speicalSyles.includes(style) ? -1 : accessibilityDisableTabOnDisabled();
        changeClassAtIndex(this.wrapper, style, 2);
        if (style === ButtonStyle.Spinner) {
            this.wrapper.classList.add("loading");
        }
        if (progress !== undefined && style === ButtonStyle.Progress) {
            this.prog.classList.add("progress");
            this.prog.style.width = `${progress.toString()}%`;
            this.wrapper.append(this.prog);
        }
        return this;
    }
    setColor(color: Color) {
        this.wrapper.tabIndex = accessibilityDisableTabOnDisabled(color);
        changeClassAtIndex(this.wrapper, color, 1);
        return this;
    }
    parseData(data: FormDataEntryValue): Value {
        return <Value>[ data.toString(), this.#dropdown.findIndex(([ value ]) => value == data) ];
    }
    saveData([ text ]: Value) {
        return text;
    }
}

export const DropDownInput = (label: string, list: string[]) => new DropDownInputComponent(list, label);