/**
 * Client with SPA
*/

const log = console.log;

var container;
var currentUser;

document.addEventListener("DOMContentLoaded", (e) => {
    
    // fill the page with the first view of the website:
    container = document.getElementById('container');
    login_init(e);

});


// view initialization functions

/**
 * (e = undefined){
    if(e != undefined) e.preventDefault();
 */

function login_init(e){
    if(e != undefined) e.preventDefault();

    // clone the view
    const login_template = document.getElementById('login-template').content.cloneNode(true);
    
    // update the view's functionalities
    login_template.getElementById('register-link')
                 .addEventListener('click', signup_init); // sign-up

    login_template.getElementById('login-submit')
                 .addEventListener('click', login); // send login info

    container.innerHTML = ''; // Clear container
    container.appendChild(login_template);
    template = login_template;
    history.pushState({}, 'Login', '#login');
}

function signup_init(e){
    if(e != undefined) e.preventDefault();

    // clone the view
    const signup_template = document.getElementById('signup-template').content.cloneNode(true);
    
    // update the view's functionalities
    signup_template.getElementById('login-link')
                 .addEventListener('click', login_init); // login

    signup_template.getElementById('signup-submit')
                 .addEventListener('click', singup); // send sign-up info

    container.innerHTML = ''; // Clear container
    container.appendChild(signup_template);
    template = signup_template;
    history.pushState({}, 'Sugnup', '#signup');

}


function personal_area_init(){
    // help function to generate a body
    function task_list_init(tasks, tbody){
        tbody.innerHTML = "";

        tasks.forEach(task => {
                var task_row = document.getElementById("table-data").content.cloneNode(true);

                task_row.getElementById("description-area").innerText = task.description;

                task_row.getElementById("delete-button")
                        .addEventListener('click', () => delete_task(task.taskid) );
                task_row.getElementById("open-button")
                        .addEventListener('click', (e) => task_init(e, task.taskid));

                task_row.getElementById("status-button")
                        .addEventListener('change', (e) => update_status(e, task.taskid));

                tbody.appendChild(task_row);            
            });

        //return tbody;
    }

    // add the task lists
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/tasks/${currentUser}`);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.\npersonal_area_init() - ${currentUser}\nwant to reload?`) // TODO: reload to send the request again.
            personal_area_init();
        } 
        else{
            // clone the view
            const task_list_template = document.getElementById('personal-area-template').content.cloneNode(true);
            
            // update the view's functionalities
            task_list_template.getElementById('add-task')
                     .addEventListener('click', (e) => {task_init(e, -1)}); // add a task to the list (first child)
            
            task_list_init(response.body.tasks, task_list_template.getElementById("tasks-body"));

            container.innerHTML = ''; // Clear container
            container.appendChild(task_list_template);

            template = task_list_template;
            history.pushState({user : currentUser}, 'Home', `#homepage/${currentUser}`);
        }
    }

    httpRequest.send();
}

function task_init(e, taskid){
    if(e != undefined) e.preventDefault();

    if(taskid === -1){
        add_task_init()
    } else{
        update_task_init(taskid)
    }

}

function update_task_init(taskid){
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/tasks/${currentUser}/${taskid}`);
    
    httpRequest.onload = function () {
        
        var response = this.response_message;
        
        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.\nupdate_task_init() - ${currentUser}`) // TODO: reload to send the request again.
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
        template = SingelTaskTemplate;
        
        history.pushState({user : currentUser, taskId : taskid}, 'Update', `#update/${currentUser}/${taskid}`);
    }

    httpRequest.send();
}

function add_task_init(){
    const SingelTaskTemplate = document.getElementById('single-task-template').content.cloneNode(true);
    
    SingelTaskTemplate.getElementById("update-button")
    .addEventListener('click', add_task);
    
    container.innerHTML = '';
    container.appendChild(SingelTaskTemplate);
    template = SingelTaskTemplate;

    history.replacehState({user : currentUser}, 'NewTask', `#newtask/${currentUser}`);
}



function login(e) {
    if(e != undefined) e.preventDefault();

    var username = document.getElementById("login-username").value;
    var password = document.getElementById("login-password").value;

    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('GET', `/users/${username}`);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says: ${response.status}, please try again later.\nlogin() - ${username}`);
        } else{
            currentUser = username;
            personal_area_init();
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

    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('POST', `/users`);

    httpRequest.onload = function () {
        var response = this.response_message;

        if(response.status != "200 OK"){
            alert(`Server says: ${response.status}. try again later.\nsignup() - ${username}`);
        } else{
            // currentUser = username;
            // personal_area_init();
            login_init();
        }// 
    };

    httpRequest.send({"username" : username, "password": password});
}

function add_task(e){
    if(e != undefined) e.preventDefault();
 
    var httpRequest = new FXMLHttpRequest();
    httpRequest.open('POST', `/tasks/${currentUser}`);

    httpRequest.onload = function (){

        var response = this.response_message;
        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.\nadd_task() - ${currentUser}`) // TODO: reload to send the request again.
        } else personal_area_init();
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
        
        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.\nupdate_task()`) // TODO: reload to send the request again.
            update_task_init(taskid);
        } else personal_area_init();
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
        
        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.\nupdate_status()`) // TODO: reload to send the request again.
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
        
        if(response.status != "200 OK"){ // TODO: add switch for different server responses
            alert(`Server says ${response.status}. Please try again later.`) // TODO: reload to send the request again.
        } else personal_area_init();
    }

    delete_request.send();
}

