'use client';
// Área 8: cronograma dia a dia, com marcação de "plano B para chuva".
import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CloudRain, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { ScheduleItem, Trip } from '@/types';
import styles from '@/styles/Package.module.css';

interface Props {
  supabase: SupabaseClient;
  trip: Trip;
  items: ScheduleItem[];
  onChange: (items: ScheduleItem[]) => void;
  onError: (msg: string) => void;
}

function dateForDay(start: string | null, day: number): string | null {
  if (!start) return null;
  const d = new Date(`${start}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toISOString().slice(0, 10);
}

export function ScheduleArea({ supabase, trip, items, onChange, onError }: Props) {
  const [form, setForm] = useState({ day: '1', time: '', title: '', location: '', rainy: false });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const day = Number(form.day);
    if (!form.title.trim() || !Number.isInteger(day) || day < 1) return;
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        trip_id: trip.id,
        day_number: day,
        activity_date: dateForDay(trip.start_date, day),
        start_time: form.time || null,
        title: form.title.trim().slice(0, 200),
        location_name: form.location.trim() || null,
        is_rainy_day_alternative: form.rainy,
      })
      .select('*')
      .single();
    if (error) return onError(error.message);
    const next = [...items, data as ScheduleItem].sort(
      (a, b) => a.day_number - b.day_number || (a.start_time ?? '').localeCompare(b.start_time ?? ''),
    );
    onChange(next);
    setForm({ ...form, time: '', title: '', location: '', rainy: false });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('schedule_items').delete().eq('id', id);
    if (error) return onError(error.message);
    onChange(items.filter((i) => i.id !== id));
  };

  const days = [...new Set(items.map((i) => i.day_number))].sort((a, b) => a - b);

  return (
    <div>
      {days.length === 0 && <p className={styles.empty}>Monte o roteiro adicionando atividades por dia.</p>}
      <div className={styles.days}>
        {days.map((day) => (
          <div key={day} className={styles.day}>
            <div className={styles.dayHead}>
              Dia {day}
              {items.find((i) => i.day_number === day)?.activity_date && (
                <span className="gt-muted"> · {formatDate(items.find((i) => i.day_number === day)?.activity_date)}</span>
              )}
            </div>
            {items.filter((i) => i.day_number === day).map((i) => (
              <div key={i.id} className={`${styles.activity} ${i.is_rainy_day_alternative ? styles.rainy : ''}`}>
                <span className={styles.activityTime}>{i.start_time ? i.start_time.slice(0, 5) : '--:--'}</span>
                <div className={styles.activityBody}>
                  <strong>{i.title}</strong>
                  {i.location_name && <span className="gt-muted">{i.location_name}</span>}
                  {i.is_rainy_day_alternative && <span className={styles.rainyTag}><CloudRain size={12} /> Plano B (chuva)</span>}
                </div>
                <button type="button" className="gt-btn gt-btn-danger gt-btn-sm" onClick={() => remove(i.id)} aria-label="Excluir atividade">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <form className={styles.scheduleForm} onSubmit={add}>
        <label className="gt-label">Dia<input className="gt-input" type="number" min={1} max={365} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></label>
        <label className="gt-label">Hora<input className="gt-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label>
        <label className="gt-label">Atividade<input className="gt-input" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Pelourinho" required /></label>
        <label className="gt-label">Local<input className="gt-input" value={form.location} maxLength={200} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Opcional" /></label>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={form.rainy} onChange={(e) => setForm({ ...form, rainy: e.target.checked })} /> Plano B chuva
        </label>
        <button type="submit" className="gt-btn gt-btn-dark"><Plus size={14} /> Adicionar</button>
      </form>
    </div>
  );
}
