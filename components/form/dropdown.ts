import { alwaysRef, asRef, asWebGenComponent, Component, css, HTMLComponent, Refable, Reference, WriteSignal } from "../../core/mod.ts";
import { MaterialIcon } from "../icons.ts";
import { Menu } from "../mod.ts";
import { TextInput } from "./input.ts";

@asWebGenComponent("dropdown")
class DropDownComponent extends HTMLComponent {
    #disabled = asRef(false);
    #invalid = asRef(false);
    #valueRender = asRef((value: string) => value);
    #valueIndex = asRef(-1);
    #menu: ReturnType<typeof Menu>;

    constructor(private dropdown: Reference<string[]>, label: Reference<string>) {
        super();

        this.#menu = Menu(dropdown)
            .onItemClick((index) => {
                this.#valueIndex.value = index;
                this.#menu.draw().hidePopover();
            });

        this.#menu.setAttribute("popover", "");

        this.shadowRoot!.append(
            TextInput(this.#valueIndex.map(it => it === -1 ? label.value : this.dropdown.value[ it ]) as WriteSignal<string>, this.#valueIndex.map(it => it === -1 ? "" : label.value))
                .setReadOnly()
                .addSuffix(MaterialIcon(this.#menu.focusedState().map(open => open ? "arrow_drop_up" : "arrow_drop_down")).setCssStyle("gridColumn", "2"))
                .onClick(() => {
                    if (this.#disabled.value) return;
                    this.#menu.clearSearch();
                    this.#menu.draw().showPopover();
                    this.#menu.focusedState().value = true;
                })
                .draw(),
            this.#menu.draw()
        );

        this.useEventListener(this.shadowRoot!, "focusin", () => {
            if (this.#disabled.value) return;
            this.#menu.clearSearch();
            this.#menu.draw().showPopover();
            this.#menu.focusedState().value = true;
        });

        this.shadowRoot!.adoptedStyleSheets.push(css`
            :host {
                position: relative;
            }
            wg-input {
                anchor-name: --anchor-dropdown;
            }
            wg-menu {
                position: fixed;
                inset: unset;
                overflow: unset;
                bottom: 1.5rem;
                padding: 0;
                background: none;
                border: none;
                width: auto;
                height: auto;
                position-anchor: --anchor-dropdown;
                top: anchor(bottom);
                left: anchor(left);
            }
        `);
    }

    override make() {
        const obj = {
            ...super.make(),
            setValueRender: (valueRender: (value: string) => string) => {
                this.#valueRender.value = valueRender;
                return obj;
            },
            setDisabled: (disabled: boolean) => {
                this.#disabled.value = disabled;
                return obj;
            },
            setInvalid: (invalid: boolean) => {
                this.#invalid.value = invalid;
                return obj;
            },
            addAction: (title: Refable<string>, icon: Component, onClick: () => void) => {
                this.#menu.addAction(title, icon, onClick);
                return obj;
            }
        };
        return obj;
    }
}

export function DropDown(dropdown: Refable<string[]>, label: Refable<string> = "") {
    return new DropDownComponent(alwaysRef(dropdown), alwaysRef(label)).make();
}