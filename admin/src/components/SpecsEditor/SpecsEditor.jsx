import React, { useEffect, useRef } from 'react';
import './SpecsEditor.css';
import { PlusIcon, CloseIcon } from '../Icons';
import { ALL_LABELS, MAX_SPECS, SPEC_PRESETS, hintFor, newRow } from '../../utils/specs';

const SpecsEditor = ({ rows, onChange, category }) => {

    const wrapRef = useRef(null);
    const focusTarget = useRef(null);   // {id, field} to focus after the next render

    useEffect(()=>{
        const target = focusTarget.current;
        if (!target) return;
        focusTarget.current = null;
        wrapRef.current?.querySelector(`[data-row="${target.id}"][data-field="${target.field}"]`)?.focus();
    });

    const atLimit = rows.length >= MAX_SPECS;
    const used = new Set(rows.map((row)=>row.label.trim().toLowerCase()));
    const suggestions = (SPEC_PRESETS[category] || []).filter((label)=>!used.has(label.toLowerCase()));

    const update = (id, field, value) => onChange(rows.map((row)=>row.id === id ? {...row,[field]:value} : row));
    const remove = (id) => onChange(rows.filter((row)=>row.id !== id));

    const addBlank = () => {
        if (atLimit) return;
        const row = newRow();
        focusTarget.current = {id:row.id,field:"label"};
        onChange([...rows,row]);
    }

    const addPreset = (label) => {
        if (atLimit) return;
        // fill an empty row first instead of piling up blank ones
        const blank = rows.find((row)=>!row.label.trim() && !row.value.trim());
        if (blank) {
            focusTarget.current = {id:blank.id,field:"value"};
            onChange(rows.map((row)=>row.id === blank.id ? {...row,label} : row));
            return;
        }
        const row = newRow(label);
        focusTarget.current = {id:row.id,field:"value"};
        onChange([...rows,row]);
    }

    // Enter moves on (and adds a row from the last one) instead of submitting the whole form
    const onKeyDown = (event, row, index, field) => {
        if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
        event.preventDefault();
        if (field === "label") {
            wrapRef.current?.querySelector(`[data-row="${row.id}"][data-field="value"]`)?.focus();
            return;
        }
        const next = rows[index + 1];
        if (next) {
            focusTarget.current = {id:next.id,field:"label"};
            update(next.id,"label",next.label); // re-render so the effect runs
        } else if (row.label.trim() && row.value.trim()) {
            addBlank();
        }
    }

    return (
        <div className="specs" ref={wrapRef}>
            <div className="specs-head">
                <h2>Specifications</h2>
                <span className="specs-count">{rows.length ? `${rows.length} / ${MAX_SPECS}` : "Optional"}</span>
            </div>
            <p className="specs-help">Add the facts shoppers compare, like screen size or storage. They show on the product card.</p>

            {suggestions.length > 0 && !atLimit &&
                <div className="specs-suggest" aria-label="Suggested specifications">
                    {suggestions.map((label)=>(
                        <button type="button" key={label} className="spec-chip" onClick={()=>addPreset(label)}>
                            <PlusIcon size={14} />{label}
                        </button>
                    ))}
                </div>
            }

            {rows.length > 0 &&
                <ul className="specs-list">
                    {rows.map((row,index)=>(
                        <li key={row.id} className="spec-row">
                            <input
                                className="control spec-label"
                                data-row={row.id}
                                data-field="label"
                                list="spec-labels"
                                value={row.label}
                                onChange={(e)=>update(row.id,"label",e.target.value)}
                                onKeyDown={(e)=>onKeyDown(e,row,index,"label")}
                                placeholder="Name, e.g. Screen size"
                                aria-label={`Specification ${index + 1} name`}
                                maxLength={40}
                                autoComplete="off"
                                required={!!row.value.trim()}
                            />
                            <input
                                className="control spec-value"
                                data-row={row.id}
                                data-field="value"
                                value={row.value}
                                onChange={(e)=>update(row.id,"value",e.target.value)}
                                onKeyDown={(e)=>onKeyDown(e,row,index,"value")}
                                placeholder={hintFor(row.label)}
                                aria-label={`Specification ${index + 1} value`}
                                maxLength={80}
                                autoComplete="off"
                                required={!!row.label.trim()}
                            />
                            <button type="button" className="spec-remove" onClick={()=>remove(row.id)} aria-label={`Remove specification ${row.label || index + 1}`}>
                                <CloseIcon size={18} />
                            </button>
                        </li>
                    ))}
                </ul>
            }

            <datalist id="spec-labels">
                {ALL_LABELS.map((label)=><option key={label} value={label} />)}
            </datalist>

            <button type="button" className="spec-add" onClick={addBlank} disabled={atLimit}>
                <PlusIcon size={18} />{atLimit ? `Limit of ${MAX_SPECS} reached` : "Add specification"}
            </button>
        </div>
    );
}

export default SpecsEditor;
