/**
 * Client with SPA
*/

const log = console.log;
var container;
var currentUser;

window.addEventListener("hashchange", set_page_from_hash);
document.addEventListener("DOMContentLoaded", (e) => {
    container = document.getElementById('page-container');
    currentUser = localStorage.getItem('currentUser');
    set_page_from_hash()
});

function set_page_from_hash() {
    var hash = window.location.hash.replace('#', '');
    var user = localStorage.getItem('currentUser');

    if (hash === 'login') {
        localStorage.setItem('currentUser', '');
        login_init();
    }
    else if (hash === 'signup') {
        signup_init();
    }
    else if (hash === `homepage/${user}`) {
        personal_area_init();
    }
    else if (hash === `newtask/${user}`) {
        add_task_init();
    }
    else if (hash.split('/')[0] === `update`) {
        update_task_init(hash.split('/')[2]);
    }
    else { //default
        window.location.hash = '#login';
    }
}


// view initialization functions
function login_init(e){
    if(e != undefined) e.preventDefault();

    // clone the view
    const login_template = document.getElementById('login-template').content.cloneNode(true);
    
    // update the view's functionalities
    login_template.getElementById('register-link')
                 .addEventListener('click', () => {window.location.hash = '#signup'}); // sign-up

    login_template.getElementById('login-submit')
                 .addEventListener('click', login); // send login info

    container.innerHTML = ''; // Clear container
    container.appendChild(login_template);
}

function signup_init(e){
    if(e != undefined) e.preventDefault();

    // clone the view
    const signup_template = document.getElementById('signup-template').content.cloneNode(true);
    
    // update the view's functionalities
    signup_template.getElementById('login-link')
                 .addEventListener('click',  () => {window.location.hash = '#login'}); // login

    signup_template.getElementById('signup-submit')
                 .addEventListener('click', singup); // send sign-up info

    container.innerHTML = ''; // Clear container
    container.appendChild(signup_template);

}

function personal_area_init(){
    // add the task lists
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/tasks/${currentUser}`);

    // clone the view
    const task_list_template = document.getElementById('personal-area-template').content.cloneNode(true);
            
    // update the view's functionalities
    task_list_template.getElementById('add-task')
             .addEventListener('click', () => {window.location.hash = `#newtask/${currentUser}`});
    
    task_list_template.getElementById("tasks-body").innerHTML = "Loading...";
    
    container.innerHTML = ''; // Clear container
    container.appendChild(task_list_template);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){
            alert(`Server says ${response.status}. Please try again later.\npersonal_area_init() - ${currentUser}`);
        }        
        else{   
            task_list_init(response.body.tasks);
        }
    }
    //asynchronous action 
    setTimeout(() => httpRequest.send(), 3000);
}

function update_task_init(taskid){
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/tasks/${currentUser}/${taskid}`);
    
    httpRequest.onload = function () {
        
        var response = this.response_message;
        
        if(response.status != "200 OK"){
            alert(`Server says ${response.status}. Please try again later.\nupdate_task_init() - ${currentUser}`)
            return;
        } 
        
        const SingelTaskTemplate = document.getElementById('single-task-template').content.cloneNode(true);
        
        var task = httpRequest.response_message.body.tasks;
        
        SingelTaskTemplate.getElementById("update-button")
        .addEventListener('click', (e) => update_task(e, task.taskid));
        
        
        SingelTaskTemplate.getElementById("description").value = task.description;
        SingelTaskTemplate.getElementById("note").value = task.note;
        SingelTaskTemplate.getElementById("status-button").checked = task.is_done;
        
        container.innerHTML = '';
        container.appendChild(SingelTaskTemplate);
    }

    httpRequest.send();
}

function add_task_init(){
    const SingelTaskTemplate = document.getElementById('single-task-template').content.cloneNode(true);
    
    SingelTaskTemplate.getElementById("update-button")
    .addEventListener('click', add_task);
    
    container.innerHTML = '';
    container.appendChild(SingelTaskTemplate);
}



// perform action through the network

function login(e) {
    if(e != undefined) e.preventDefault();

    var username = document.getElementById("login-username").value;
    var password = document.getElementById("login-password").value;

    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/users/${username}`);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){
            alert(`Server says: ${response.status}, please try again later.\nlogin() - ${username}`);
        } else{
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            window.location.hash = `homepage/${currentUser}`;
        }
    };

    httpRequest.send({"password": password});
}

function singup(e) {
    if(e != undefined) e.preventDefault();

    var username = document.getElementById("signup-username").value;
    var password = document.getElementById("signup-password").value;
    var confirm_password = document.getElementById("confirm-password").value;

    if (password != confirm_password){
        alert("'Password' and 'verify password' are not the same. Please check again.");
        return;
    }
    if(password.length < 4 ){
        alert('password must contain at least 4 characters');
        return;
    }
    if(!password.match("[a-zA-Z]") || !password.match("[0-9]")){
        alert('password must contain at least 1 letter and 1 number');
        return;
    }

    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('POST', `/users`);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){
            alert(`Server says: ${response.status}. try again later.\nsignup() - ${username}`);
        } else{
            window.location.hash = '#login';
        }
    };

    httpRequest.send({"username" : username, "password": password});
}

function task_list_init(tasks){
    // help function to generate the rows in the table
    var tbody = document.getElementById("tasks-body")
    tbody.innerHTML = "";

    tasks.forEach(task => {
            var task_row = document.getElementById("table-data").content.cloneNode(true);

            task_row.getElementById("description-area").innerText = task.description;

            task_row.getElementById("delete-button")
                    .addEventListener('click', () => delete_task(task.taskid) );
            task_row.getElementById("open-button")
                    .addEventListener('click',  () => {window.location.hash = `#update/${currentUser}/${task.taskid}`});

            task_row.getElementById("status-button")
                    .addEventListener('change', (e) => update_status(e, task.taskid));
            task_row.getElementById("status-button").checked = task.is_done;
            tbody.appendChild(task_row);            
        });
}

function add_task(e){
    if(e != undefined) e.preventDefault();
 
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('POST', `/tasks/${currentUser}`);

    httpRequest.onload = function (){

        var response = this.response_message;
        if(response.status != "200 OK"){ 
            alert(`Server says ${response.status}. Please try again later.\nadd_task() - ${currentUser}`)
        } else window.location.hash = `homepage/${currentUser}`; // personal_area_init();
    }

    var source = document.getElementById("task-info-to-save");

    var desc = source.description.value;
    var note = source.note.value;
    var is_done = source["status-button"].checked;

    httpRequest.send({'description': desc, 'note': note, 'is_done': is_done})
}

function update_task(e, taskid) {
    if(e != undefined) e.preventDefault();

    var httpRequest = new FXMLHttpRequest(); 
    httpRequest.open('PUT', `/tasks/${currentUser}/${taskid}`);

    httpRequest.onload = function () {
        var response = this.response_message;
        
        if(response.status != "200 OK"){
            alert(`Server says ${response.status}. Please try again later.\nupdate_task()`)
            //update_task_init(taskid);
        } else window.location.hash = `homepage/${currentUser}`; //personal_area_init();
    }

    var desc = document.getElementById("description").value;
    var note = document.getElementById("note").value;
    var is_done = document.getElementById("status-button").checked;
   
    httpRequest.send({'description': desc, 'note': note, 'is_done': is_done });
}

function update_status(e, taskid) {
    if(e != undefined) e.preventDefault();
    var button = e.target;

    var request = new FXMLHttpRequest();
    request.open('PUT', `/tasks/${currentUser}/${taskid}`);

    request.onload = function() {
        var response = this.response_message;
        
        if(response.status != "200 OK"){
            alert(`Server says ${response.status}. Please try again later.\nupdate_status()`)
            button.checked = !button.checked;
        } 
    };

    request.send({is_done : button.checked });    
}

function delete_task(taskid) {
    var delete_request = new FXMLHttpRequest();
    delete_request.open('DELETE', `/tasks/${currentUser}/${taskid}`);

    delete_request.onload = function () {
        var response = this.response_message;
        
        if(response.status != "200 OK"){
            alert(`Server says ${response.status}. Please try again later.`)
        } else personal_area_init();
    }

    delete_request.send();
}

