// src/context/CategoryContext.jsx
import { createContext, useContext, useState } from "react";

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const [category, setCategory] = useState(() => {
    const raw = localStorage.getItem("cv.category");
    if (!raw) return null;
    try {
      return JSON.parse(raw); // { id, nombre } si ya guardamos así
    } catch {
      // por si tenías antes "gym"/"fisio"
      return raw;
    }
  });

  const [selectedMuscleIds, setSelectedMuscleIds] = useState([]); // number[]
  const [selectedDetalleIds, setSelectedDetalleIds] = useState([]); // number[]

  const chooseCategory = (value) => {
    setCategory(value);
    localStorage.setItem("cv.category", JSON.stringify(value));
    setSelectedMuscleIds([]);
    setSelectedDetalleIds([]);
  };

  const clearCategory = () => {
    setCategory(null);
    localStorage.removeItem("cv.category");
    setSelectedMuscleIds([]);
    setSelectedDetalleIds([]);
  };

  const toggleMuscle = (id) => {
    const numId = Number(id);
    setSelectedMuscleIds((prev) =>
      prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]
    );
    setSelectedDetalleIds([]);
  };

  const toggleDetalle = (id) => {
    const numId = Number(id);
    setSelectedDetalleIds((prev) =>
      prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]
    );
  };

  const resetFlow = () => {
    setSelectedMuscleIds([]);
    setSelectedDetalleIds([]);
  };

  return (
    <CategoryContext.Provider
      value={{
        category,
        chooseCategory,
        clearCategory,
        selectedMuscleIds,
        toggleMuscle,
        selectedDetalleIds,
        toggleDetalle,
        resetFlow,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategory = () => useContext(CategoryContext);
