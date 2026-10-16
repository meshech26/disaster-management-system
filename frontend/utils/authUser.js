// Login responses use `id`; database profiles use `_id`.
export const normalizeAuthUser = (user) => {
  if (!user) return null;
  const id = user._id || user.id;
  return { ...user, id, _id: id };
};
