import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ComponentDefinition, ComponentType } from '../../types';

const COMPONENTS: ComponentDefinition[] = [
  { type: 'hero', label: 'Hero Section', icon: '🦸', defaultProps: {}, category: 'layout' },
  { type: 'header', label: 'Heading', icon: 'H', defaultProps: {}, category: 'content' },
  { type: 'text', label: 'Text Block', icon: '¶', defaultProps: {}, category: 'content' },
  { type: 'button', label: 'Button', icon: '⬜', defaultProps: {}, category: 'interactive' },
  { type: 'image', label: 'Image', icon: '🖼', defaultProps: {}, category: 'media' },
  { type: 'video', label: 'Video', icon: '▶', defaultProps: {}, category: 'media' },
  { type: 'card', label: 'Card', icon: '🃏', defaultProps: {}, category: 'layout' },
  { type: 'columns', label: 'Columns', icon: '⊞', defaultProps: {}, category: 'layout' },
  { type: 'divider', label: 'Divider', icon: '—', defaultProps: {}, category: 'layout' },
  { type: 'spacer', label: 'Spacer', icon: '↕', defaultProps: {}, category: 'layout' },
  { type: 'form', label: 'Form', icon: '📋', defaultProps: {}, category: 'interactive' },
  { type: 'table', label: 'Table', icon: '⊞', defaultProps: {}, category: 'data' },
  { type: 'chart', label: 'Chart', icon: '📊', defaultProps: {}, category: 'data' },
  { type: 'testimonial', label: 'Testimonial', icon: '💬', defaultProps: {}, category: 'content' },
];

const CATEGORIES = ['layout', 'content', 'media', 'data', 'interactive'] as const;

export default function ComponentPalette() {
  return (
    <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700">Components</h3>
        <p className="text-xs text-gray-400 mt-1">Drag to add to canvas</p>
      </div>

      <Droppable droppableId="palette" isDropDisabled={true}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {CATEGORIES.map((category) => {
              const items = COMPONENTS.filter((c) => c.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="p-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">
                    {category}
                  </p>
                  {items.map((comp, index) => (
                    <Draggable key={comp.type} draggableId={comp.type} index={index}>
                      {(provided, snapshot) => (
                        <>
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-grab text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${snapshot.isDragging ? 'bg-blue-100 shadow-md opacity-80' : 'text-gray-700'}`}
                          >
                            <span className="w-5 text-center">{comp.icon}</span>
                            <span>{comp.label}</span>
                          </div>
                          {snapshot.isDragging && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-700 opacity-40 bg-gray-100">
                              <span className="w-5 text-center">{comp.icon}</span>
                              <span>{comp.label}</span>
                            </div>
                          )}
                        </>
                      )}
                    </Draggable>
                  ))}
                </div>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
