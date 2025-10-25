console.log("✅ chat.js loaded successfully");

import { db, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, onSnapshot, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const usernameDisplay = document.getElementById("currentUser");
// Variabel kontak dihapus
// const contactsList = document.getElementById("contacts");
// const addContactInput = document.getElementById("addContact");
// const addContactBtn = document.getElementById("addBtn");
const chatHeader = document.getElementById("chatWith");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const fileInput = document.getElementById("fileInput");
const deleteAllBtn = document.getElementById("deleteAll");

let currentUsername = null;
// Variabel P2P dihapus: let selectedContact = null;
let unsubscribeChat = null;

// TENTUKAN ID RUANGAN CHAT PUBLIK DI SINI
const PUBLIC_ROOM_ID = "global_chat_stream"; 
const chatRoomMessagesRef = collection(db, "chats", PUBLIC_ROOM_ID, "messages");


// 🔹 Initialize chat system after login
export async function initChat(username) {
  console.log("🔹 initChat running for:", username);
  currentUsername = username;
  usernameDisplay.textContent = username;
  
  // Langsung panggil fungsi stream chat, bukan loadContacts()
  startGlobalChatStream();
}


// ----------------------------------------------------
// FUNGSI UTAMA UNTUK STREAM CHAT
// ----------------------------------------------------

// 🔹 Start Global Chat Stream
function startGlobalChatStream() {
  if (unsubscribeChat) {
    unsubscribeChat();
  }
  
  chatBox.innerHTML = ''; // Bersihkan chat box lama
  chatHeader.textContent = "Global Stream Chat"; 
  
  // Query untuk mengambil semua pesan, diurutkan berdasarkan waktu
  const q = query(chatRoomMessagesRef, orderBy("time"));

  // onSnapshot untuk mendengarkan pesan secara real-time
  unsubscribeChat = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const msgId = change.doc.id;
      
      if (change.type === "added") {
        displayMessage(data, msgId);
      }
      if (change.type === "removed") {
        document.getElementById(`msg-${msgId}`)?.remove();
      }
    });

    // Menggulir ke bawah setiap ada pesan baru
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// 🔹 FUNGSI UTILITY: displayMessage
function displayMessage(data, msgId) {
    // Cek jika pesan sudah ada untuk menghindari duplikasi
    if (document.getElementById(`msg-${msgId}`)) return;
    
    const isCurrentUser = data.user === currentUsername;
    const div = document.createElement("div");
    div.id = `msg-${msgId}`;
    div.className = `message ${isCurrentUser ? "sent" : "received"}`;
    
    let content = data.text ? `<p>${data.text}</p>` : '';
    if (data.fileURL) {
      // Logic file handling
      const fileName = data.fileURL.split('/').pop().split('_').pop();
      if (data.fileURL.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        content += `<a href="${data.fileURL}" target="_blank"><img src="${data.fileURL}" alt="Image" style="max-width:200px; display: block;"></a>`;
      } else {
        content += `<a href="${data.fileURL}" target="_blank" class="file-link">📎 File: ${fileName}</a>`;
      }
    }
    
    div.innerHTML = `
      <span class="message-user">${isCurrentUser ? "You" : data.user}</span>
      ${content}
      <span class="message-time">${new Date(data.time).toLocaleTimeString()}</span>
      ${isCurrentUser ? `<button data-id="${msgId}" class="deleteMsg">🗑️</button>` : ""}
    `;
    
    chatBox.appendChild(div);
    
    // Attach event listener for delete button
    if (isCurrentUser) {
      const deleteBtn = div.querySelector(".deleteMsg");
      if(deleteBtn) {
        deleteBtn.onclick = async () => {
          // Path dokumen diarahkan ke ruangan publik
          const msgDoc = doc(db, "chats", PUBLIC_ROOM_ID, "messages", deleteBtn.dataset.id);
          const data = (await getDoc(msgDoc)).data();
          if (data.fileURL) {
            const fileRef = ref(storage, data.fileURL);
            try { await deleteObject(fileRef); } catch {}
          }
          await deleteDoc(msgDoc);
        };
      }
    }
}


// ----------------------------------------------------
// FUNGSI sendBtn & deleteAllBtn (disesuaikan)
// ----------------------------------------------------

// 🔹 Kirim pesan
sendBtn.onclick = async () => {
  let fileURL = null;
  const file = fileInput.files[0];
  
  if (file) {
    // Gunakan PUBLIC_ROOM_ID untuk folder storage
    const fileRef = ref(storage, `chatFiles/${PUBLIC_ROOM_ID}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    fileURL = await getDownloadURL(fileRef);
    fileInput.value = "";
  }

  const text = msgInput.value.trim();
  if (!text && !fileURL) return;

  // Menggunakan chatRoomMessagesRef untuk mengirim pesan ke ruangan publik
  await addDoc(chatRoomMessagesRef, {
    user: currentUsername,
    text: text || "",
    fileURL: fileURL || null,
    time: Date.now()
  });
  msgInput.value = "";
};

// 🔹 Hapus semua pesan
deleteAllBtn.onclick = async () => {
  if (confirm("Delete all chat messages in this stream?")) {
    const snap = await getDocs(chatRoomMessagesRef); 
    snap.forEach(async (m) => {
      const data = m.data();
      if (data.fileURL) {
        const fileRef = ref(storage, data.fileURL);
        try { await deleteObject(fileRef); } catch {}
      }
      await deleteDoc(m.ref);
    });
    chatBox.innerHTML = ''; // Bersihkan UI juga
  }
};
