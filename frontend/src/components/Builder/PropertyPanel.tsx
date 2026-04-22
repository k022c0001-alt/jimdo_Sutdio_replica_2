import { useBuilderStore } from '../../store/builderStore';

export default function PropertyPanel() {
  const { components, selectedComponentId, updateComponent, selectComponent } = useBuilderStore();
  const component = components.find((c) => c.id === selectedComponentId);
  if (!component) return null;

  function update(key: string, value: any) {
    updateComponent(component!.id, { [key]: value });
  }

  function renderFields() {
    const { type, props } = component!;
    switch (type) {
      case 'header':
        return (
          <>
            <Field label="Text">
              <input className={INPUT} value={props.text || ''} onChange={(e) => update('text', e.target.value)} />
            </Field>
            <Field label="Level">
              <select className={INPUT} value={props.level || 'h1'} onChange={(e) => update('level', e.target.value)}>
                <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option>
              </select>
            </Field>
            <Field label="Align">
              <AlignSelect value={props.align} onChange={(v) => update('align', v)} />
            </Field>
          </>
        );
      case 'text':
        return (
          <>
            <Field label="Content">
              <textarea className={INPUT} rows={4} value={props.content || ''} onChange={(e) => update('content', e.target.value)} />
            </Field>
            <Field label="Align">
              <AlignSelect value={props.align} onChange={(v) => update('align', v)} />
            </Field>
          </>
        );
      case 'image':
        return (
          <>
            <Field label="Image URL">
              <input className={INPUT} value={props.src || ''} onChange={(e) => update('src', e.target.value)} />
            </Field>
            <Field label="Alt Text">
              <input className={INPUT} value={props.alt || ''} onChange={(e) => update('alt', e.target.value)} />
            </Field>
            <Field label="Width">
              <input className={INPUT} value={props.width || '100%'} onChange={(e) => update('width', e.target.value)} />
            </Field>
          </>
        );
      case 'button':
        return (
          <>
            <Field label="Label">
              <input className={INPUT} value={props.label || ''} onChange={(e) => update('label', e.target.value)} />
            </Field>
            <Field label="Link">
              <input className={INPUT} value={props.href || '#'} onChange={(e) => update('href', e.target.value)} />
            </Field>
            <Field label="Variant">
              <select className={INPUT} value={props.variant || 'primary'} onChange={(e) => update('variant', e.target.value)}>
                <option value="primary">Primary</option><option value="outline">Outline</option>
              </select>
            </Field>
            <Field label="Align">
              <AlignSelect value={props.align} onChange={(v) => update('align', v)} />
            </Field>
          </>
        );
      case 'hero':
        return (
          <>
            <Field label="Title">
              <input className={INPUT} value={props.title || ''} onChange={(e) => update('title', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <textarea className={INPUT} rows={2} value={props.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} />
            </Field>
            <Field label="CTA Text">
              <input className={INPUT} value={props.ctaText || ''} onChange={(e) => update('ctaText', e.target.value)} />
            </Field>
            <Field label="Background Color">
              <input type="color" className={INPUT} value={props.bgColor || '#1d4ed8'} onChange={(e) => update('bgColor', e.target.value)} />
            </Field>
          </>
        );
      case 'card':
        return (
          <>
            <Field label="Title">
              <input className={INPUT} value={props.title || ''} onChange={(e) => update('title', e.target.value)} />
            </Field>
            <Field label="Content">
              <textarea className={INPUT} rows={3} value={props.content || ''} onChange={(e) => update('content', e.target.value)} />
            </Field>
            <Field label="Image URL">
              <input className={INPUT} value={props.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} />
            </Field>
          </>
        );
      case 'spacer':
        return (
          <Field label="Height (px)">
            <input type="number" className={INPUT} value={props.height || 40} onChange={(e) => update('height', parseInt(e.target.value))} />
          </Field>
        );
      case 'divider':
        return (
          <>
            <Field label="Style">
              <select className={INPUT} value={props.style || 'solid'} onChange={(e) => update('style', e.target.value)}>
                <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
              </select>
            </Field>
            <Field label="Color">
              <input type="color" className={INPUT} value={props.color || '#e5e7eb'} onChange={(e) => update('color', e.target.value)} />
            </Field>
          </>
        );
      case 'testimonial':
        return (
          <>
            <Field label="Quote">
              <textarea className={INPUT} rows={3} value={props.quote || ''} onChange={(e) => update('quote', e.target.value)} />
            </Field>
            <Field label="Author">
              <input className={INPUT} value={props.author || ''} onChange={(e) => update('author', e.target.value)} />
            </Field>
            <Field label="Role/Title">
              <input className={INPUT} value={props.role || ''} onChange={(e) => update('role', e.target.value)} />
            </Field>
          </>
        );
      case 'video':
        return (
          <Field label="YouTube Embed URL">
            <input className={INPUT} value={props.url || ''} onChange={(e) => update('url', e.target.value)} />
          </Field>
        );
      default:
        return <p className="text-xs text-gray-500">No editable properties.</p>;
    }
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700 capitalize">{component.type} Properties</h3>
        <button onClick={() => selectComponent(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>
      <div className="p-3 space-y-3">{renderFields()}</div>
    </div>
  );
}

const INPUT = 'w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function AlignSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className={INPUT} value={value || 'left'} onChange={(e) => onChange(e.target.value)}>
      <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
    </select>
  );
}
