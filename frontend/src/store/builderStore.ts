import { create } from 'zustand';
import { Page, PageComponent, ComponentType } from '../types';

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface BuilderStore {
  pages: Page[];
  currentPage: Page | null;
  components: PageComponent[];
  selectedComponentId: string | null;
  isDirty: boolean;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  setComponents: (components: PageComponent[]) => void;
  addComponent: (type: ComponentType, defaultProps?: Record<string, any>) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, props: Record<string, any>, styles?: Record<string, any>) => void;
  reorderComponents: (startIndex: number, endIndex: number) => void;
  selectComponent: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
}

const DEFAULT_PROPS: Record<string, Record<string, any>> = {
  header: { text: 'Welcome to My Site', level: 'h1', align: 'center' },
  text: { content: 'Add your text content here. Click to edit.', align: 'left' },
  image: { src: 'https://via.placeholder.com/800x400', alt: 'Image', width: '100%' },
  button: { label: 'Click Me', href: '#', variant: 'primary', align: 'left' },
  card: { title: 'Card Title', content: 'Card content goes here.', imageUrl: '' },
  table: { headers: ['Name', 'Value', 'Status'], rows: [['Item 1', '100', 'Active'], ['Item 2', '200', 'Pending']] },
  form: { fields: [{ label: 'Name', type: 'text' }, { label: 'Email', type: 'email' }], submitLabel: 'Submit' },
  chart: { type: 'bar', data: [{ name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 }], title: 'Chart' },
  hero: { title: 'Hero Headline', subtitle: 'Your compelling sub-headline goes here', ctaText: 'Get Started', bgColor: '#1d4ed8' },
  divider: { style: 'solid', color: '#e5e7eb' },
  spacer: { height: 40 },
  columns: { columnCount: 2, gap: 16 },
  video: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Video' },
  testimonial: { quote: 'This is an amazing product!', author: 'John Doe', role: 'CEO, Company' },
};

export const useBuilderStore = create<BuilderStore>((set) => ({
  pages: [],
  currentPage: null,
  components: [],
  selectedComponentId: null,
  isDirty: false,

  setPages: (pages) => set({ pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setComponents: (components) => set({ components, isDirty: false }),

  addComponent: (type, defaultProps) => {
    const newComponent: PageComponent = {
      id: genId(),
      page_id: '',
      type,
      order_index: 0,
      props: { ...(DEFAULT_PROPS[type] || {}), ...defaultProps },
      styles: {},
    };
    set((state) => ({
      components: [...state.components, { ...newComponent, order_index: state.components.length }],
      selectedComponentId: newComponent.id,
      isDirty: true,
    }));
  },

  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      isDirty: true,
    }));
  },

  updateComponent: (id, props, styles) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props }, styles: styles ? { ...c.styles, ...styles } : c.styles } : c
      ),
      isDirty: true,
    }));
  },

  reorderComponents: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.components);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { components: result.map((c, i) => ({ ...c, order_index: i })), isDirty: true };
    });
  },

  selectComponent: (id) => set({ selectedComponentId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),
}));
