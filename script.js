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
const successText = document.getElementById("successCount");
const failureText = document.getElementById("failureCount");

const usersList = document.getElementById("usersList");
const postsList = document.getElementById("postsList");

const updateStatus = (state, error = "-") =>{
    stateText.textContent = state;
    timeText.textContent = new Date().toLocaleTimeString();
    errorText.textContent = error;
    successText.textContent = successCount;
    failureText.textContent = failureCount;
}

const errorTest = {
  users404: false,
  force500: false,
  timeout: false,
  badJSON: false,
  commentsFail: false
};

const resolveURL = (key) =>{
    if(errorTest.force500) return "https://jsonplaceholder.typicode.com/throw500";
    if(key === "users" && errorTest.users404) return URLS.users + "s";
    if(key === "users" && errorTest.badJSON) return URLS.users + "?badjson=true";
    if(key === "comments" && errorTest.commentsFail) return URLS.comments + "s";
    return URLS[key];
}

const fetchWithTimeout = (url) =>{
    const effectiveTimeout = errorTest.timeout ? 1 : timeout;

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
            setTimeout(() => reject(new Error('Timeout')), effectiveTimeout)
        )
    ])
}

const fetchWithRetry = (url, retries = 2, delay = 300) =>{
    return fetchWithTimeout(url)
    .catch(err =>{
        if(retries === 0) throw err;
        return new Promise(res => setTimeout(res, delay))
        .then(() => fetchWithRetry(url, retries - 1, delay * 2));
    })
}

const renderUsers = (users) =>{
    usersList.innerHTML = "";
    users.forEach(user =>{
        const li = document.createElement("li");
        li.textContent = `${user.name} (${user.email} - ${user.company.name})`;
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

const processResults = (results) =>{
    successCount = 0;
    failureCount = 0;
    results.forEach(r => r.status === "fulfilled" ? successCount++ : failureCount++);
}

const loadDashboardPromise = () =>{
    mode = 'promise'
    modeText.textContent = "Promise";
    updateStatus("loading");

    Promise.allSettled([
        fetchWithRetry(resolveURL("users")),
        fetchWithRetry(resolveURL("posts")),
        fetchWithRetry(resolveURL("comments"))
    ])
    .then(results =>{
        processResults(results);
        const [usersRes, postsRes, commentsRes] = results;

        if(usersRes.status === "fulfilled") renderUsers(usersRes.value);

        if(usersRes.status === "fulfilled" && postsRes.status === "fulfilled"){
            renderPosts(
                postsRes.value, 
                usersRes.value, 
                commentsRes.status === "fulfilled" ? commentsRes.value : null
            )
        };

        updateStatus(
            commentsRes.status === "rejected" ? "partial" : "success",
            commentsRes.reason?.message || "-"
        );
    })
    .catch(err =>{
        updateStatus("error", err.message);
    })
    .finally(() => console.log("Dashboard load attempt finished."));
}

const loadDashboardAsync = async () =>{
    mode = "async";
    modeText.textContent = "Async/Await";
    updateStatus("loading");

    const results = await Promise.allSettled([
        fetchWithRetry(resolveURL("users")),
        fetchWithRetry(resolveURL("posts")),
        fetchWithRetry(resolveURL("comments"))
    ]);

    processResults(results);

    const [usersRes, postsRes, commentsRes] = results;

    try{
        if(usersRes.status === "fulfilled") renderUsers(usersRes.value);

        if(usersRes.status === "fulfilled" && postsRes.status === "fulfilled"){
            renderPosts(
                postsRes.value, 
                usersRes.value, 
                commentsRes.status === "fulfilled" ? commentsRes.value : null
            )
        };

        updateStatus(
            commentsRes.status === "rejected" ? "partial" : "success",
            commentsRes.reason?.message || "-"
        );
    }catch(err){
        updateStatus("error", err.message);
    }finally{
        console.log("Dashboard load attempt finished.");
    }
}

document.getElementById("modeToggle").addEventListener("change", e =>{
    mode = e.target.checked ? "async" : "promise";
    modeText.textContent = mode === "async" ? "Async/Await" : "Promise";
});

document.getElementById("loadBtn").addEventListener("click", () =>{
    mode === "async" ? loadDashboardAsync() : loadDashboardPromise();
});

document.getElementById("refreshBtn").addEventListener("click", () =>{
    usersList.innerHTML = "";
    postsList.innerHTML = "";
    mode === "async" ? loadDashboardAsync() : loadDashboardPromise();
});

loadDashboardPromise();
