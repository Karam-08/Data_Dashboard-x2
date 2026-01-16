const URLS = {
    users: "https://jsonplaceholder.typicode.com/users",
    posts: "https://jsonplaceholder.typicode.com/posts",
    comments: "https://jsonplaceholder.typicode.com/comments"
};

const timeout = 2500
let mode = 'promise'

let successCount = 0
let failureCount = 0

const modeText = document.getElementById("mode");
const stateText = document.getElementById("state");
const timeText = document.getElementById("time");
const errorText = document.getElementById("errorMsg");

const usersList = document.getElementById("usersList");
const postsList = document.getElementById("postsList");

const updateStatus = (state, error = "-") =>{
    stateText.textContent = state;
    timeText.textContent = new Date().toLocaleTimeString();
    errorText.textContent = error;
}

const fetchWithTimeout = (url) =>{
    return Promise.race([
        fetch(url).then(res =>{
                if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.text();
            }).then(text =>{
                try{
                    return JSON.parse(text);
                }catch{
                    throw new Error("Invalid JSON response");
                }
            }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ])
}

const fetchWithRetry = (url, retries = 2) =>{
    return fetchWithTimeout(url)
    .catch(err =>{
        if(retries === 0) throw err;
        return new Promise(r => setTimeout(r, 500))
        .then(() => fetchWithRetry(url, retries - 1));
    })
}

const renderUsers = (users) =>{
    usersList.innerHTML = "";
    users.forEach(user =>{
        const li = document.createElement("li");
        li.textContent = `${user.name} (${user.email})`;
        usersList.appendChild(li);
    });
}

const renderPosts = (posts, users, comments) =>{
    postsList.innerHTML = "";
    
    posts.forEach(post =>{
        const author = users.find(u => u.id === post.userId)?.name || "Unknown";

        const commentCount = comments ? comments.filter(c => c.postId === post.id).length : "N/A";

        const li = document.createElement("li");
        li.textContent = `${post.title} — ${author} | Comments: ${commentCount}`;
        postsList.appendChild(li);
    });
}

// Promise Mode

const loadDashboardPromise = () =>{
    mode = 'promise'
    modeText.textContent = "Promise";
    updateStatus("Loading...");

    Promise.allSettled([
        fetchWithRetry(URLS.users),
        fetchWithRetry(URLS.posts),
        fetchWithRetry(URLS.comments)
    ])
    .then(([usersRes, postsRes, commentsRes]) =>{
        if(usersRes.status === "fulfilled") renderUsers(usersRes.value);

        if(postsRes.status === "fulfilled" && commentsRes.status === "fulfilled"){
            renderPosts(
                postsRes.value, 
                usersRes.value, 
                commentsRes.status === "fulfilled" ? commentsRes.value : null
            )
        };

        updateStatus(commentsRes.status === "Rejected" ? "Partial" : "Success!", commentsRes.reason?.message);
    })
    .catch(err =>{
        updateStatus("Error:", err.message);
    })
    .finally(() => {});
}

const loadDashboardAsync = async () =>{
    mode = "async";
    modeText.textContent = "Async/Await";
    updateStatus("Loading...");

    const results = await Promise.allSettled([
        fetchWithRetry(URLS.users),
        fetchWithRetry(URLS.posts),
        fetchWithRetry(URLS.comments)
    ]);

    const [usersRes, postsRes, commentsRes] = results;

    try{
        if(usersRes.status === "fulfilled") renderUsers(usersRes.value);

    if(usersRes.status === "fulfilled" && postsRes.status === "fulfilled") 
        renderPosts(postsRes.value, usersRes.value, commentsRes.status === "fulfilled" ? commentsRes.value : null);

    updateStatus(
      commentsRes.status === "Rejected" ? "Partial" : "Success!",
      commentsRes.reason?.message
    );
  }catch(err){
    updateStatus("error", err.message);
  } finally {}
}

// Event Listeners

document.getElementById("modeToggle").addEventListener("change", e => {
  mode = e.target.checked ? "async" : "promise";
  modeText.textContent = mode === "async" ? "Async/Await" : "Promise";
});

document.getElementById("loadBtn").addEventListener("click", () => {
  mode === "async" ? loadDashboardAsync() : loadDashboardPromise();
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  usersList.innerHTML = "";
  postsList.innerHTML = "";
  mode === "async" ? loadDashboardAsync() : loadDashboardPromise();
});


// Initial Load
loadDashboardPromise();