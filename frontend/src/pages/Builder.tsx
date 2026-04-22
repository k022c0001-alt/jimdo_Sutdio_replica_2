import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pagesApi } from '../api/client';
import { useBuilderStore } from '../store/builderStore';
import { Page } from '../types';
import DragDropBuilder from '../components/Builder/DragDropBuilder';

export default function Builder() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { pages, currentPage, components, isDirty, setPages, setCurrentPage, setComponents } = useBuilderStore();
  const [loading, setLoading] = useState(false);
  const [showPageList, setShowPageList] = useState(!pageId);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pagesApi.list().then(res => {
      setPages(res.data.pages || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pageId) {
      setLoading(true);
      pagesApi.get(pageId).then(res => {
        setCurrentPage(res.data.page);
        const comps = (res.data.components || []).map((c: any) => ({
          ...c,
          props: typeof c.props === 'string' ? JSON.parse(c.props) : c.props,
          styles: typeof c.styles === 'string' ? JSON.parse(c.styles) : c.styles,
        }));
        setComponents(comps);
        setShowPageList(false);
      }).catch(() => toast.error('Failed to load page')).finally(() => setLoading(false));
    }
  }, [pageId]);

  async function createPage() {
    if (!newPageTitle.trim()) return;
    try {
      const res = await pagesApi.create({ title: newPageTitle });
      const page = res.data.page;
      setPages([...pages, page]);
      setNewPageTitle('');
      navigate(`/builder/${page.id}`);
    } catch {
      toast.error('Failed to create page');
    }
  }

  async function savePage() {
    if (!currentPage) return;
    setSaving(true);
    try {
      await pagesApi.saveComponents(currentPage.id, components);
      toast.success('Page saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function publishPage() {
    if (!currentPage) return;
    try {
      await pagesApi.update(currentPage.id, { status: 'published' });
      setCurrentPage({ ...currentPage, status: 'published' });
      toast.success('Page published!');
    } catch {
      toast.error('Failed to publish');
    }
  }

  async function deletePage(page: Page) {
    if (!confirm(`Delete "${page.title}"?`)) return;
    try {
      await pagesApi.delete(page.id);
      setPages(pages.filter(p => p.id !== page.id));
      if (currentPage?.id === page.id) {
        setCurrentPage(null);
        navigate('/builder');
        setShowPageList(true);
      }
      toast.success('Page deleted');
    } catch {
      toast.error('Failed to delete page');
    }
  }

  if (showPageList || !pageId) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Page Builder</h1>
          </div>

          {/* Create new page */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Create New Page</h3>
            <div className="flex gap-3">
              <input
                value={newPageTitle}
                onChange={e => setNewPageTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createPage()}
                placeholder="Page title..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createPage}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          {/* Pages list */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">Your Pages ({pages.length})</h3>
            </div>
            {pages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">📄</div>
                <p>No pages yet. Create your first page above!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pages.map(page => (
                  <div key={page.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{page.title}</p>
                      <p className="text-xs text-gray-400">/{page.slug} • {new Date(page.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {page.status}
                      </span>
                      <Link to={`/builder/${page.id}`} className="text-sm text-blue-600 hover:underline px-2">
                        Edit
                      </Link>
                      <button onClick={() => deletePage(page)} className="text-sm text-red-500 hover:underline px-2">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading page...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Builder toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowPageList(true); navigate('/builder'); }} className="text-sm text-gray-500 hover:text-gray-700">
            ← Pages
          </button>
          {currentPage && (
            <>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-800">{currentPage.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${currentPage.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {currentPage.status}
              </span>
              {isDirty && <span className="text-xs text-amber-600">● Unsaved changes</span>}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={savePage}
            disabled={saving}
            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={publishPage}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DragDropBuilder />
      </div>
    </div>
  );
}
