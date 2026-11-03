import * as Dropdown from "@radix-ui/react-select";
import { Children, Fragment, isValidElement } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import type { SelectProps, SelectOption } from "../../types";
function options(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((node) => {
    if (
      !isValidElement<{
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      }>(node)
    )
      return [];
    if (node.type === Fragment || node.type === "optgroup")
      return options(node.props.children);
    if (node.type !== "option") return [];
    const text = Children.toArray(node.props.children)
      .filter((c) => typeof c === "string" || typeof c === "number")
      .join("");
    return [
      {
        value: String(node.props.value ?? text),
        label: node.props.children,
        disabled: node.props.disabled,
      },
    ];
  });
}
export default function Select({
  value,
  onChange,
  children,
  className = "",
  placeholder,
  disabled,
  required,
  id,
  name,
  "aria-label": label,
}: SelectProps) {
  const items = options(children);
  const empty = items.find((o) => o.value === "");
  return (
    <Dropdown.Root
      value={String(value ?? "") || "__all__"}
      onValueChange={(value) =>
        onChange({ target: { value: value === "__all__" ? "" : value } })
      }
      disabled={disabled}
      required={required}
      name={name}
    >
      <Dropdown.Trigger
        id={id}
        aria-label={label}
        className={`inline-flex min-w-[124px] items-center justify-between gap-3 rounded border-[0.5px] border-edge bg-surface px-3 py-2 text-left text-base text-noir outline-none hover:bg-ivory/50 focus-visible:ring-1 focus-visible:ring-gold data-[state=open]:border-gold disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        <Dropdown.Value
          placeholder={placeholder || empty?.label || "Choose an option"}
        />
        <Dropdown.Icon>
          <ChevronDown aria-hidden size={12} className="shrink-0 text-muted" />
        </Dropdown.Icon>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          data-venda-select-content="true"
          position="popper"
          sideOffset={5}
          collisionPadding={12}
          className="z-[2200] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border-[0.5px] border-edge bg-surface text-base text-noir"
        >
          <Dropdown.ScrollUpButton
            aria-label="Scroll options up"
            className="flex justify-center bg-ivory py-1"
          >
            <ChevronUp aria-hidden size={12} />
          </Dropdown.ScrollUpButton>
          <Dropdown.Viewport className="max-h-64 p-1">
            {items
              .filter((o) => o.value !== "" || !placeholder)
              .map((o) => (
                <Dropdown.Item
                  key={o.value}
                  value={o.value || "__all__"}
                  disabled={o.disabled}
                  className="relative flex cursor-pointer select-none items-center rounded py-2 pl-7 pr-4 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-gold/10 data-[highlighted]:text-noir data-[state=checked]:text-gold"
                >
                  <Dropdown.ItemIndicator className="absolute left-2">
                    <Check aria-hidden size={11} />
                  </Dropdown.ItemIndicator>
                  <Dropdown.ItemText>{o.label}</Dropdown.ItemText>
                </Dropdown.Item>
              ))}
          </Dropdown.Viewport>
          <Dropdown.ScrollDownButton
            aria-label="Scroll options down"
            className="flex justify-center bg-ivory py-1"
          >
            <ChevronDown aria-hidden size={12} />
          </Dropdown.ScrollDownButton>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
