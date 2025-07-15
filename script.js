// ✅ Firebase setup (move this to script.js)
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdbnExInmMM6ZxPeIJ9Om1m3k0Iv9AEKE",
  authDomain: "communitynoticeboard-a878e.firebaseapp.com",
  projectId: "communitynoticeboard-a878e",
  storageBucket: "communitynoticeboard-a878e.firebasestorage.app",
  messagingSenderId: "742583568776",
  appId: "1:742583568776:web:72f4365808174d4956123d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);


// Export db to use throughout the file
export { db };


async function removePost(button) {
  if (confirm("Are you sure you want to delete this item?")) {
    const li = button.parentElement;
    const docId = li.getAttribute("data-docid");
    const type = li.getAttribute("data-type");

    li.remove();

    try {
      await deleteDoc(doc(db, type === "post" ? "posts" : "contacts", docId));
      console.log("✅ Deleted from Firestore:", docId);
    } catch (e) {
      console.error("❌ Error deleting from Firestore:", e);
    }
  }
}

function showSection(id) {
  const sections = document.querySelectorAll('.content');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function showModal(message, options = {}) {
  const modal = document.getElementById("custom-modal");
  const msgBox = document.getElementById("modal-message");
  const inputBox = document.getElementById("modal-input");
  const okBtn = document.getElementById("modal-ok");
  const cancelBtn = document.getElementById("modal-cancel");

  msgBox.textContent = message;

  const isPrompt = options.prompt === true;
  inputBox.classList.toggle("hidden", !isPrompt);
  cancelBtn.classList.toggle("hidden", !isPrompt);
  inputBox.value = "";

  modal.classList.remove("hidden");

  return new Promise((resolve) => {
    okBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(isPrompt ? inputBox.value : true);
    };

    cancelBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(null);
    };
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');

  if (html.getAttribute('data-theme') === 'light') {
    html.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    html.setAttribute('data-theme', 'light');
    themeToggleBtn.textContent = '🌙';
  }
}

let isAdmin = false;

function toggleForm() {
  const selected = document.getElementById("entry-type").value;

  const postForm = document.getElementById("post-form");
  const contactForm = document.getElementById("contact-form");
  const categoryInput = document.getElementById("post-category");

  const datetimeFields = document.getElementById("datetime-fields");
  const marketplaceFields = document.getElementById("marketplace-fields");

  // Show contact form only if 'contacts' selected
  if (selected === "contacts") {
    contactForm.classList.remove("hidden");
    postForm.classList.add("hidden");
  } else {
    contactForm.classList.add("hidden");
    postForm.classList.remove("hidden");
    categoryInput.value = selected;

    // Toggle extra fields
    if (selected === "announcements" || selected === "events") {
      datetimeFields.classList.remove("hidden");
      marketplaceFields.classList.add("hidden");
    } else if (selected === "marketplace") {
      datetimeFields.classList.add("hidden");
      marketplaceFields.classList.remove("hidden");
    } else {
      datetimeFields.classList.add("hidden");
      marketplaceFields.classList.add("hidden");
    }
  }
}

async function loadPostsFromFirebase() {
  const querySnapshot = await getDocs(collection(db, "posts"));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    data.id = docSnap.id;
    appendPostToUI(data);
  });
}

async function loadContactsFromFirebase() {
  const querySnapshot = await getDocs(collection(db, "contacts"));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    data.id = docSnap.id;
    appendContactToUI(data);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPostsFromFirebase();
  await loadContactsFromFirebase();

  const postForm = document.getElementById("post-form");
  if (postForm) {
    postForm.addEventListener("submit", addPost);
  }

  document.body.addEventListener('click', function (e) {
    if (e.target.classList.contains('delete-btn')) {
      removePost(e.target);
    }
  });

  // ✅ Login button logic
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = async () => {
      if (auth.currentUser) {
        await signOut(auth);
        showModal("🚪 Logged out");
      } else {
        const email = await showModal("Enter email:", { prompt: true });
        if (!email) return;
        const password = await showModal("Enter password:", { prompt: true });
        if (!password) return;
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
          console.error(e);
          showModal("❌ Login failed");
        }
      }
    };
  }
});

onAuthStateChanged(auth, (user) => {
  const loginBtn = document.getElementById("login-btn");
  const panel = document.getElementById("admin-panel");

  if (user) {
    panel.classList.remove("hidden");
    showDeleteButtons();
    loginBtn.textContent = "🔓";
  } else {
    panel.classList.add("hidden");
    hideDeleteButtons();
    loginBtn.textContent = "🔐";
  }
});


// 🔐 Admin Access Prompt
function promptAdmin() {
  showModal("Admin access now requires login via 🔓 button.");
}


// 📝 Add new post dynamically
async function addPost(event) {
  event.preventDefault();
  console.log("🧪 addPost() called");

  const category = document.getElementById("post-category").value;
  const message = document.getElementById("post-message").value;
  const date = document.getElementById("post-date")?.value || null;
  const time = document.getElementById("post-time")?.value || null;
  const contact = document.getElementById("market-contact")?.value || null;
  const price = document.getElementById("market-price")?.value || null;

  const newPost = {
    category,
    message,
    date,
    time,
    contact,
    price,
    timestamp: Date.now()
  };

  console.log("Form values:", { category, message, date, time, contact, price });

  try {
    const docRef = await addDoc(collection(db, "posts"), newPost);
    newPost.id = docRef.id; // Firestore doc ID
    appendPostToUI(newPost);
    showModal("✅ Post added successfully!");
    event.target.reset();
  } catch (e) {
    console.error("Error adding post:", e);
    showModal("❌ Failed to add post.");
  }
}

function appendPostToUI(post) {
  const ul = document.getElementById(`${post.category}-list`);
  const li = document.createElement("li");

  li.setAttribute("data-id", post.timestamp || Date.now());
  li.setAttribute("data-docid", post.id); // Firestore doc ID
  li.setAttribute("data-type", "post");
  li.setAttribute("data-category", post.category);

  let html = `${post.message}`;

  if (post.date || post.time) {
    html += ` <br /><small>📅 ${post.date || ""} ⏰ ${post.time || ""}</small>`;
  }

  if (post.contact || post.price) {
    html += `<br /><small>👤 ${post.contact || ""} ₹${post.price || ""}</small>`;
  }

  html += ` <span class="delete-btn hidden">🗑️</span>`;

  li.innerHTML = html;
  ul.appendChild(li);
}

async function addContact(event) {
  event.preventDefault();

  const name = document.getElementById("contact-name").value;
  const number = document.getElementById("contact-number").value;

  const newContact = {
    name,
    number,
    timestamp: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, "contacts"), newContact);
    newContact.id = docRef.id;
    appendContactToUI(newContact);
    showModal("✅ Contact added successfully!");
    event.target.reset();
  } catch (e) {
    console.error("Error adding contact:", e);
    showModal("❌ Failed to add contact.");
  }
}

function appendContactToUI(contact) {
  const ul = document.getElementById("contacts-list");
  const li = document.createElement("li");

  li.setAttribute("data-id", contact.timestamp || Date.now());
  li.setAttribute("data-docid", contact.id); // Firestore doc ID
  li.setAttribute("data-type", "contact");

  li.innerHTML = `${contact.name}: ${contact.number} <span class="delete-btn hidden">🗑️</span>`;
  ul.appendChild(li);
}

function showDeleteButtons() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.classList.remove('hidden');
  });
}

function hideDeleteButtons() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.classList.add('hidden');
  });
}

// Expose global functions for inline event handlers
window.toggleTheme = toggleTheme;
window.promptAdmin = promptAdmin;
window.showSection = showSection;
window.toggleForm = toggleForm;
window.addPost = addPost;
window.addContact = addContact;
