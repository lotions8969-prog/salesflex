export const USERS = [
  { id: "katagiri",  name: "Katagiri Yasuhiro" },
  { id: "kobayashi", name: "Kobayashi Ryosuke" },
  { id: "miyashita", name: "Miyashita Yusuke" },
  { id: "okada",     name: "Okada Yuji" },
  { id: "okimoto",   name: "Okimoto Takuya" },
];

export type UserId = typeof USERS[number]["id"];
