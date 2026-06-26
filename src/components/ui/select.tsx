import * as React from "react";
import { Combobox } from "./combobox";

/**
 * Select — façade sur <Combobox>.
 *
 * Anciennement un <select> natif ; désormais rendu via <Combobox> pour que TOUTES
 * les listes déroulantes desktop de l'application partagent le même déclencheur, le
 * même panneau et le même comportement (recherche auto au-delà de 10 options).
 *
 * On garde l'API native (<option> en enfants + onChange recevant un event) afin de
 * ne pas toucher les formulaires appelants : on lit les <option> pour construire
 * les items et on rejoue un ChangeEvent minimal ({ target: { value } }) sur onChange.
 *
 * NB : les filtres mobiles (md:hidden) restent des <select> natifs — sur tactile le
 * picker natif iOS/Android est la meilleure UX et n'apparaît jamais sur desktop.
 */

function nodeToText(node: React.ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  return "";
}

function readOptions(children: React.ReactNode): {
  items: { id: string; label: string }[];
  placeholder?: string;
  hadEmpty: boolean;
} {
  const items: { id: string; label: string }[] = [];
  let placeholder: string | undefined;
  let hadEmpty = false;
  const walk = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      const el = child as React.ReactElement<{
        value?: unknown;
        children?: React.ReactNode;
      }>;
      if (el.type === "optgroup") {
        walk(el.props.children);
        return;
      }
      if (el.type !== "option") return;
      const value = el.props.value == null ? "" : String(el.props.value);
      const label = nodeToText(el.props.children) || value;
      if (value === "") {
        // Option vide = placeholder + champ effaçable, jamais un item sélectionnable.
        hadEmpty = true;
        if (label) placeholder = label;
        return;
      }
      items.push({ id: value, label });
    });
  };
  walk(children);
  return { items, placeholder, hadEmpty };
}

export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  id,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { items, placeholder, hadEmpty } = readOptions(children);
  return (
    <Combobox
      id={id}
      items={items}
      value={value == null ? "" : String(value)}
      onChange={(v) =>
        onChange?.({
          target: { value: v },
          currentTarget: { value: v },
        } as unknown as React.ChangeEvent<HTMLSelectElement>)
      }
      placeholder={placeholder ?? "Sélectionner…"}
      searchable={items.length > 10}
      clearable={hadEmpty}
      disabled={disabled}
      className={className}
    />
  );
}
