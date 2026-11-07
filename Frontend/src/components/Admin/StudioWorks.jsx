import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Icon } from '@iconify/react';
import { apiOrigin } from '../../apiOrigin';
import { youtubeThumb } from '../../youtube';

const categories = ['Choir song', 'Livestream', 'Wedding', 'Music film', 'Podcast', 'Photography', 'Corporate', 'Other'];

const emptyForm = {
  title: '',
  client: '',
  category: 'Choir song',
  youtubeUrl: '',
  description: '',
  year: String(new Date().getFullYear()),
  location: '',
  published: true,
  featured: false,
  sortOrder: 0,
};

const StudioWorks = () => {
  const [works, setWorks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await axios.get(`${apiOrigin}/api/studio/works/manage`);
    setWorks(response.data.works || []);
  };

  useEffect(() => {
    load().catch(() => toast.error('Could not load studio films.'));
  }, []);

  const edit = (work) => {
    setEditingId(work.id);
    setForm({
      title: work.title || '',
      client: work.client || '',
      category: work.category || 'Other',
      youtubeUrl: work.youtubeUrl || '',
      description: work.description || '',
      year: work.year || '',
      location: work.location || '',
      published: work.published !== false,
      featured: Boolean(work.featured),
      sortOrder: work.sortOrder || 0,
    });
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await axios.put(`${apiOrigin}/api/studio/works/${editingId}`, form);
      else await axios.post(`${apiOrigin}/api/studio/works`, form);
      toast.success(editingId ? 'Film updated.' : 'Film added to the studio site.');
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save this film.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (work) => {
    if (!window.confirm(`Remove “${work.title}” from the studio site?`)) return;
    try {
      await axios.delete(`${apiOrigin}/api/studio/works/${work.id}`);
      toast.success('Film removed.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not remove this film.');
    }
  };

  const thumb = youtubeThumb(form.youtubeUrl);
  const categoryOptions = categories.includes(form.category) ? categories : [form.category, ...categories];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio films</h1>
          <p className="mt-1 text-gray-600">Publish client work from YouTube. Choir songs, livestreams, and other shoots appear on the studio site.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingId(null); setForm(emptyForm); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white"
        >
          <Icon icon="carbon:add" className="h-4 w-4" />
          Add film
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Title</span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Client</span>
              <input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Category</span>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                {categoryOptions.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">YouTube link</span>
              <input value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Year</span>
              <input value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Location</span>
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-gray-700">Description</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />
              Published
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
              Show on the studio homepage
            </label>
            <label className="inline-flex items-center gap-2">
              Order
              <input type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="w-20 rounded-lg border border-gray-300 px-2 py-1" />
            </label>
          </div>
          {thumb && <img src={thumb} alt="" className="mt-4 h-36 w-64 rounded-lg object-cover" />}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {works.length === 0 ? (
          <p className="p-6 text-gray-500">No client films yet. Add a YouTube link to publish the first one.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {works.map((work) => (
              <li key={work.id} className="flex flex-wrap items-center gap-4 p-4">
                {youtubeThumb(work.youtubeUrl) ? (
                  <img src={youtubeThumb(work.youtubeUrl)} alt="" className="h-16 w-28 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-gray-100 text-gray-400">No preview</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{work.title}</p>
                  <p className="text-sm text-gray-500">{work.client} · {work.category}</p>
                  <div className="mt-1 flex gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${work.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{work.published ? 'Published' : 'Hidden'}</span>
                    {work.featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Homepage</span>}
                  </div>
                </div>
                <button type="button" onClick={() => edit(work)} className="text-sm font-semibold text-green-800">Edit</button>
                <button type="button" onClick={() => remove(work)} className="text-sm font-semibold text-red-700">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudioWorks;
