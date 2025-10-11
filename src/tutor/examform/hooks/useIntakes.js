import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const useIntakes = () => {
  const [intakes, setIntakes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = query(collection(db, "intakes"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        const arr = snap.docs.map((d) => ({ id: d.id, name: d.data().name }));
        if (mounted) setIntakes(arr);
      } catch (e) {
        console.error("Error fetching intakes:", e);
        if (mounted) setError("Failed to fetch intake data.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { intakes, error };
};

export default useIntakes;
