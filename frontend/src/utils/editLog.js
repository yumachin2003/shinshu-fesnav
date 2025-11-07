// src/utils/editLog.js

/**
 * 履歴データをlocalStorageから取得する（ユーザーごと）
 * @param {string} username
 * @returns {Array} ユーザーの編集履歴一覧
 */
export const getUserLogs = (username) => {
  try {
    const logs = localStorage.getItem(`festivalEditLogs_${username}`);
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

/**
 * 履歴データを保存する
 * @param {string} username
 * @param {Array} logs
 */
export const saveUserLogs = (username, logs) => {
  localStorage.setItem(`festivalEditLogs_${username}`, JSON.stringify(logs));
};

/**
 * 編集履歴を追加する
 * @param {string} username
 * @param {number} festivalId
 * @param {string} festivalName - お祭り名
 * @param {string} content
 * @returns {Array} 更新後の履歴配列
 */
export const addEditLog = (username, festivalId, festivalName, content) => {
  if (!username) return [];
  const logs = getUserLogs(username);

  const newLog = {
    festival: festivalName || "不明なお祭り",
    content,
    date: new Date().toLocaleString(),
  };

  const updatedLogs = [newLog, ...logs];
  saveUserLogs(username, updatedLogs);
  return updatedLogs;
};

/**
 * すべての履歴を取得（オプションで全ユーザー対象も）
 * @param {string} username
 * @param {boolean} includeAllUsers - true の場合は全ユーザーの履歴を統合して返す
 */
export const getAllEditLogs = (username, includeAllUsers = false) => {
  if (!includeAllUsers) return getUserLogs(username);

  const allLogs = [];
  for (const key in localStorage) {
    if (key.startsWith("festivalEditLogs_")) {
      try {
        const userLogs = JSON.parse(localStorage.getItem(key));
        allLogs.push(...userLogs);
      } catch {}
    }
  }
  return allLogs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};
