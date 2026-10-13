"use client";

import { editFieldTypes, editFormPresets, fieldId, MAX_FIELDS, type EditField, type EditFieldType } from "@/lib/edits";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "../icons";
import { Field, Input, Select, Switch, Textarea, secondaryButton } from "./ui";

export type EditSettings = { editsEnabled: boolean; editTurnaround: string; editForm: EditField[] };

/*
 * Studio → Store → a template's edits: whether members can ask for an edit,
 * how long it takes, and the request form they fill in. Start from a preset
 * (lower third, basic) or add fields one by one.
 */
export function EditFormBuilder({ value, onChange }: { value: EditSettings; onChange: (patch: Partial<EditSettings>) => void }) {
  const form = value.editForm;
  const setForm = (next: EditField[]) => onChange({ editForm: next });
  const update = (id: string, patch: Partial<EditField>) => setForm(form.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  function addPreset(fields: EditField[]) {
    const taken = form.map((f) => f.id);
    setForm([...form, ...fields.filter((f) => !taken.includes(f.id))].slice(0, MAX_FIELDS));
  }

  function addField() {
    const id = fieldId("field", form.map((f) => f.id));
    setForm([...form, { id, label: "", type: "text", required: false, placeholder: "", help: "", options: [] }]);
  }

  function move(index: number, by: -1 | 1) {
    const next = [...form];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    setForm(next);
  }

  return (
    <section aria-labelledby="edits-title" className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <h3 id="edits-title" className="text-sm font-medium text-foreground">
          Edits
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">For members without the software: they fill in a form and your team sends back the edited files.</p>
      </div>
      <Switch
        id="store-edits"
        label="Members can request an edit"
        hint="Adds a Request an edit button beside Download. Each request uses one of the member's monthly edits."
        checked={value.editsEnabled}
        onChange={(on) => {
          onChange({ editsEnabled: on });
          // A first switch-on starts with the right preset, so the form is never empty.
          if (on && !form.length) addPreset(editFormPresets[0].fields);
        }}
      />

      {value.editsEnabled && (
        <>
          <Field label="Turnaround" htmlFor="store-edit-turnaround" hint="Shown on the request form.">
            <Input
              id="store-edit-turnaround"
              value={value.editTurnaround}
              maxLength={80}
              placeholder="e.g. Delivered within 2 working days"
              onChange={(e) => onChange({ editTurnaround: e.target.value })}
            />
          </Field>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground">Request form</h4>
              <span className="text-xs text-muted-foreground">
                {form.length} {form.length === 1 ? "field" : "fields"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {editFormPresets.map((preset) => (
                <button key={preset.key} type="button" onClick={() => addPreset(preset.fields)} title={preset.hint} className={`${secondaryButton} h-8 px-3 text-xs`}>
                  <PlusIcon className="size-3.5" /> {preset.name} fields
                </button>
              ))}
            </div>

            {form.length > 0 && (
              <ol className="mt-3 space-y-3">
                {form.map((f, i) => (
                  <li key={f.id} className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-start gap-2">
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
                        <Field label="Label" htmlFor={`edit-field-${f.id}-label`}>
                          <Input
                            id={`edit-field-${f.id}-label`}
                            value={f.label}
                            maxLength={80}
                            placeholder="e.g. Name on screen"
                            onChange={(e) => update(f.id, { label: e.target.value })}
                          />
                        </Field>
                        <Field label="Type" htmlFor={`edit-field-${f.id}-type`}>
                          <Select
                            id={`edit-field-${f.id}-type`}
                            value={f.type}
                            onChange={(e) => update(f.id, { type: e.target.value as EditFieldType, options: e.target.value === "select" && f.options.length < 2 ? ["", ""] : f.options })}
                          >
                            {editFieldTypes.map((t) => (
                              <option key={t.type} value={t.type}>
                                {t.name}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      </div>
                      <span className="flex shrink-0 flex-col pt-6">
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${f.label || "field"} up`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 disabled:opacity-30">
                          <ChevronDownIcon className="size-4 rotate-180" />
                        </button>
                        <button type="button" disabled={i === form.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${f.label || "field"} down`} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 disabled:opacity-30">
                          <ChevronDownIcon className="size-4" />
                        </button>
                      </span>
                    </div>

                    {f.type === "select" ? (
                      <Field label="Choices" htmlFor={`edit-field-${f.id}-options`} hint="One per line.">
                        <Textarea
                          id={`edit-field-${f.id}-options`}
                          rows={3}
                          value={f.options.join("\n")}
                          onChange={(e) => update(f.id, { options: e.target.value.split("\n").slice(0, 20) })}
                        />
                      </Field>
                    ) : (
                      f.type !== "color" &&
                      f.type !== "file" && (
                        <Field label="Example" htmlFor={`edit-field-${f.id}-placeholder`} hint="Shown faintly inside the empty field.">
                          <Input id={`edit-field-${f.id}-placeholder`} value={f.placeholder} maxLength={120} onChange={(e) => update(f.id, { placeholder: e.target.value })} />
                        </Field>
                      )
                    )}
                    <div className="mt-3">
                      <Field label="Help text" htmlFor={`edit-field-${f.id}-help`}>
                        <Input id={`edit-field-${f.id}-help`} value={f.help} maxLength={200} placeholder="Optional" onChange={(e) => update(f.id, { help: e.target.value })} />
                      </Field>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" checked={f.required} onChange={(e) => update(f.id, { required: e.target.checked })} className="size-4 accent-[var(--brand)]" />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm(form.filter((x) => x.id !== f.id))}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                      >
                        <TrashIcon className="size-4" /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <button type="button" disabled={form.length >= MAX_FIELDS} onClick={addField} className={`${secondaryButton} mt-3`}>
              <PlusIcon className="size-4" /> Add a field
            </button>
          </div>
        </>
      )}
    </section>
  );
}
