export const generateUniqueId = () =>
    Math.random().toString(36).substring(2, 9);
  
  export const ensureUniqueIds = (list) =>
    (list || []).map((q) => {
      const newQ = { ...q, id: q.id || generateUniqueId() };
  
      if (newQ.type === "multiple-choice") {
        if (Array.isArray(newQ.options) && newQ.options.length > 0) {
          newQ.options = newQ.options.map((opt) =>
            typeof opt === "string"
              ? { id: generateUniqueId(), text: opt }
              : { ...opt, id: opt.id || generateUniqueId() }
          );
        } else {
          newQ.options = [
            { id: generateUniqueId(), text: "" },
            { id: generateUniqueId(), text: "" },
          ];
        }
      } else if (newQ.type === "true-false") {
        if (!Array.isArray(newQ.options) || newQ.options.length === 0) {
          newQ.options = ["True", "False"];
        }
      } else if (newQ.type === "match") {
        if (Array.isArray(newQ.matchPairs) && newQ.matchPairs.length > 0) {
          newQ.matchPairs = newQ.matchPairs.map((pair) => ({
            ...pair,
            id: pair.id || generateUniqueId(),
          }));
        } else {
          newQ.matchPairs = [{ id: generateUniqueId(), left: "", right: "" }];
        }
      }
      return newQ;
    });
  