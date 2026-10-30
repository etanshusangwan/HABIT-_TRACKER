const STORAGE_KEY = "habitverse-habits-v1";
const HISTORY_KEY = "habitverse-history-v1";
const starterHabits = [
  { id: "h1", name: "Read 10 pages", category: "Learning", icon: "📚", done: false, streak: 3 },
  { id: "h2", name: "Drink 8 glasses of water", category: "Health", icon: "💧", done: false, streak: 5 },
  { id: "h3", name: "Morning movement", category: "Health", icon: "🏃", done: false, streak: 2 }
];

let habits = load(STORAGE_KEY, starterHabits);
let history = load(HISTORY_KEY, {});
let editingId = null;
const $ = (id) => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0, 10);
function load(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
function dateText() {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("toast").classList.remove("show"), 2300);
}
function render() {
  const list = $("habit-list");
  list.innerHTML = "";
  $("empty-state").hidden = habits.length > 0;
  habits.forEach(habit => {
    const row = document.createElement("div");
    row.className = "habit-row";
    const emoji = document.createElement("div"); emoji.className = "habit-emoji"; emoji.textContent = habit.icon;
    const info = document.createElement("div"); info.className = "habit-info";
    const name = document.createElement("strong"); name.textContent = habit.name;
    const meta = document.createElement("small"); meta.textContent = `${habit.category} · ${habit.streak || 0} day streak`;
    info.append(name, meta);
    const actions = document.createElement("div"); actions.className = "habit-actions";
    const del = document.createElement("button"); del.className = "delete-habit"; del.type = "button"; del.title = "Delete habit"; del.setAttribute("aria-label", `Delete ${habit.name}`); del.textContent = "×";
    del.addEventListener("click", () => deleteHabit(habit.id));
    const check = document.createElement("button"); check.className = `habit-check${habit.done ? " done" : ""}`; check.type = "button"; check.textContent = "✓"; check.title = habit.done ? "Mark as not done" : "Mark as complete"; check.setAttribute("aria-label", check.title);
    check.addEventListener("click", () => toggleHabit(habit.id));
    actions.append(del, check); row.append(emoji, info, actions); list.append(row);
  });
  const completed = habits.filter(h => h.done).length;
  const percent = habits.length ? Math.round(completed / habits.length * 100) : 0;
  $("total-count").textContent = habits.length;
  $("completed-count").textContent = completed;
  $("completion-caption").textContent = habits.length ? `${habits.length - completed} left to complete` : "Add your first habit";
  $("progress-percent").textContent = `${percent}%`;
  $("progress-bar").style.width = `${percent}%`;
  $("best-streak").innerHTML = `${Math.max(0, ...habits.map(h => h.streak || 0))} <em>days</em>`;
  $("habit-count-pill").textContent = `${habits.length} habit${habits.length === 1 ? "" : "s"}`;
  renderWeek();
}
function toggleHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  habit.done = !habit.done;
  const key = todayKey();
  if (!history[key]) history[key] = [];
  history[key] = habits.filter(h => h.done).map(h => h.id);
  if (habit.done) habit.streak = (habit.streak || 0) + 1;
  else habit.streak = Math.max(0, (habit.streak || 0) - 1);
  save(); render();
  showToast(habit.done ? "Habit completed. Nice work!" : "Completion undone.");
}
function deleteHabit(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit || !confirm(`Delete "${habit.name}"?`)) return;
  habits = habits.filter(h => h.id !== id);
  save(); render(); showToast("Habit deleted.");
}
function openDialog() {
  editingId = null;
  $("habit-form").reset();
  $("dialog-title").textContent = "Create a habit";
  $("habit-dialog").showModal();
  $("habit-name").focus();
}
function renderWeek() {
  const container = $("week-bars"); container.innerHTML = "";
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday); date.setDate(monday.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const done = key === todayKey() ? habits.filter(h => h.done).length : (history[key] || []).length;
    const max = Math.max(1, habits.length);
    const col = document.createElement("div"); col.className = "day-col";
    const track = document.createElement("div"); track.className = "bar-track";
    const fill = document.createElement("div"); fill.className = "bar-fill"; fill.style.height = `${Math.min(100, done / max * 100)}%`;
    const label = document.createElement("small"); label.textContent = labels[i];
    track.append(fill); col.append(track, label); container.append(col);
  }
}
$("date-label").textContent = dateText();
$("add-habit-top").addEventListener("click", openDialog);
$("empty-add").addEventListener("click", openDialog);
$("close-dialog").addEventListener("click", () => $("habit-dialog").close());
$("cancel-dialog").addEventListener("click", () => $("habit-dialog").close());
$("habit-form").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("habit-name").value.trim();
  if (!name) return;
  habits.push({ id: `h${Date.now()}`, name, category: $("habit-category").value, icon: $("habit-icon").value, done: false, streak: 0 });
  save(); render(); $("habit-dialog").close(); showToast("Your new habit has been added!");
});
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
  link.classList.add("active");
}));
render();
