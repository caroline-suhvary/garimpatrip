"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plane, MapPin, Loader2 } from "lucide-react";
import type { PlaceSuggestion } from "@/app/api/autocomplete/route";
import styles from "@/styles/Autocomplete.module.css";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export function AutocompleteInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  icon,
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const isSelectingRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Se o usuário acabou de clicar numa sugestão da lista, não dispara busca
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const trimmed = query.trim();

    // Começa a sugerir a partir de 3 letras digitadas
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/autocomplete?term=${encodeURIComponent(trimmed)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const items = data.results || [];
          setSuggestions(items);
          setIsOpen(items.length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: PlaceSuggestion) => {
    isSelectingRef.current = true;
    setQuery(item.label);
    onChange(item.label);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.inputField} ref={wrapperRef}>
      {icon}
      <div className={styles.inputContent}>
        <label className={styles.inputLabel} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            isSelectingRef.current = false;
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={styles.textInput}
          autoComplete="off"
        />
      </div>

      {loading && <Loader2 size={16} className={styles.spinner} />}

      {isOpen && suggestions.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`${styles.item} ${idx === selectedIndex ? styles.itemSelected : ""}`}
              onClick={() => handleSelect(item)}>
              <div className={styles.itemMain}>
                <span className={styles.itemIcon}>
                  {item.type === "airport" ? (
                    <Plane size={15} />
                  ) : (
                    <MapPin size={15} />
                  )}
                </span>
                <div className={styles.itemText}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.subtitle && (
                    <span className={styles.itemSub}>{item.subtitle}</span>
                  )}
                </div>
              </div>
              <span className={styles.itemBadge}>{item.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
