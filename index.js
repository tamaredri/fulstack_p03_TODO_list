const log = console.log;

/**
 * Data Base implementation
 */

class DB {
    constructor() {
        log('DB constructor');
    }

    /**
     *  private functions
     */

    _usersFactory = (password)=>{
        return {
            password,
            task_running_number : 0,
            tasks : []
        };
    }
    
    _taskFactory = (taskid, description, note)=>{
        return {
            taskid,
            description,
            note,
            is_done : false,
            is_valid: true
        };
    }

    /**
     *  USER DB
     */

    GET_users(username) {
        // return the user that has the requested id
        var user_data = localStorage.getItem(username)
        if(!user_data) return false;

        user_data = JSON.parse(user_data);
        user_data.username = username;
        
        log('GET_user', user_data);
        return user_data;
    }

    POST_users(username, password){
        // store the user. check if the user does not already exist
        if(this.GET_users(username) || username === undefined) return false;

        var user_data = this._usersFactory(password);

        log('POST_user', user_data);
        
        localStorage.setItem(username, JSON.stringify(user_data));
        return true;
    }


    /**
     *  TASKS DB
     */
    GET_tasks(username, taskid = -1){
        var user_data = this.GET_users(username);

        if(!user_data) return false;

        var all_tasks = user_data.tasks.filter((t) => t.is_valid);

        log('GET_tasks list', all_tasks)
        if (taskid <= -1) return all_tasks; // return false if the user has no tasks?


        // the users does not exist or the requested id is invalid - break in 2 return clauses?
        if(taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].is_valid) 
                return false;
        
        log('GET_tasks single', user_data.tasks[taskid]);
        return user_data.tasks[taskid];
    }

    POST_tasks(username, description, note){
        var user_data = this.GET_users(username);
        if(!user_data) return false;

        var running_id = parseInt(user_data.task_running_number);
        
        if(description === undefined) description = "";
        if(note === undefined) note = "";
        
        user_data.tasks[running_id] = 
                        this._taskFactory(user_data.task_running_number, description, note);
            
        log('POST_tasks', user_data.tasks[running_id]);

        user_data.task_running_number = running_id + 1;
        delete user_data.username;

        localStorage.setItem(username, JSON.stringify(user_data));
        return true;
    }

    PUT_tasks(username, taskid, description = undefined, note = undefined, is_done = undefined){
        var user_data = this.GET_users(username);
        if(!user_data || 
            taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].is_valid) 
            return false;
            
            
        var task = this.GET_tasks(username, taskid);

        if(description != undefined) task.description = description;
        if(note != undefined) task.note = note;
        if(is_done != undefined) task.is_done = is_done;

        user_data.tasks[task.taskid] = task;
        
        log('PUT_tasks', user_data.tasks[task.taskid]);

        delete user_data.username;
        
        localStorage.setItem(username, JSON.stringify(user_data));
        return true;
    }

    DELETE_tasks(username, taskid){
        var user_data = this.GET_users(username);
        if(!user_data || 
            taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].is_valid) 
                return false;

        user_data.tasks[taskid].is_valid = false;

        log('DELETE_tasks', user_data.tasks[taskid]);

        delete user_data.username;
        
        localStorage.setItem(username, JSON.stringify(user_data));
        return true;
    }
}


/**
 * Server implementation
 */


class Message {
    set method(met){
        this.request_method = met;
    }
    
    get method(){
        return this.request_method;
    }

    set url(url_string){
        this.url_request = url_string;
    }
    
    get url(){
        return this.url_request;
    }

    set status_code(status) {
        this.status = status;
    }

    get status_code(){
        return this.status;
    }

    set body(body) {
        this.body_data = body;
    }

    get body() {
        return this.body_data;
    }
}

class Server{
    constructor(){
        this.db_access = get_db();
        // this.network_access = get_network(); - circular dependancies
    }


    parseMessage(httpRequest, parseDoneCallBack){
        // go the message fields - type Message
        httpRequest.readyState = 2; // 2: request received
        httpRequest.readyState = 3; // 3: processing request

        var request_url = httpRequest.request_message.url.split('/').slice(1);
        var body = httpRequest.request_message.body;
        var response = new Message();
        response.status = "200 OK";
        

        switch (request_url[0]) {
            case 'users':
                
                switch (httpRequest.request_message.method) {
                    case 'GET':
                        // check credentials. if there was a false returned or wrong password - find an error with the request body.
                        if (request_url.length != 2 || body  === undefined) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var user_data = this.db_access.GET_users(request_url[1]);
                        
                        if(!user_data){
                            response.status = "404 Not Found"; // the user was not found
                            break;
                        }

                        if(user_data.password != body.password) {
                            response.status = "403 Forbidden"; // wrong password
                            break;
                        }

                        break;
                        
                    case 'POST':
                        // store the user in the DB and return a code according to the result of the DB function. 
                        if (request_url.length != 1 || body  === undefined){
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        if(!this.db_access.POST_users(body.username, body.password)){
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed
                        break; 
        
                    default:
                        response.status = "400 Bad Request";
                        // the url was unrecognized
                        break;
                }
                break;


            case 'tasks':
                switch (httpRequest.request_message.method) {
                    case 'GET':
                        // check if the get requests the entire list or just 1 task. 
                        // according to the return value of the DB - decied the code to return
                        if(2 > request_url.length || request_url.length > 3){
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var taskid = -1;
                        if(request_url.length === 3) taskid = parseInt(request_url[2]);

                        var tasks = this.db_access.GET_tasks(request_url[1], taskid);
                        if(!tasks) {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        response.body = {'tasks' : tasks};

                        break;
                        
                    case 'POST':
                        if (request_url.length != 2 || body  === undefined) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.POST_tasks(request_url[1], body.description, body.note))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break; 

                    case 'PUT':
                        if (request_url.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        if(!this.db_access.PUT_tasks(request_url[1], parseInt(request_url[2]), 
                                                    httpRequest.request_message.body.description,
                                                    httpRequest.request_message.body.note, 
                                                    httpRequest.request_message.body.is_done)){
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break;

                    case 'DELETE':
                        if (request_url.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.DELETE_tasks(request_url[1], parseInt(request_url[2])))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break;

                    default:
                        response.status = "400 Bad Request";
                        break;
                }
                break;
        
            default:
                response.status = "400 Bad Request";
                break;
        }
        
        // send the response to the caller
        httpRequest.response_message = response;
        httpRequest.network.response(httpRequest);
    }  
}


class Network{
    constructor(){
        this.server = get_server();
    }

    request(httpMessage){
        // randomly send 500 ERROR code - the server is not responding
        httpMessage.readyState = 1; // 1: server connection established
        if(Math.floor(Math.random() * 7) === 0){
            httpMessage.response_message  = new Message();
            httpMessage.response_message.status = "503 Service Unavailable";

            this.response(httpMessage);
        } else{
            this.server.parseMessage(httpMessage, this.response);
        }
    }

    response(httpMessage){
        httpMessage.readyState = 4; // 4: request finished and response is ready
        httpMessage.onload();
    }

}


class FXMLHttpRequest{
    constructor(){
        this.network = get_network();
        this.readyState = 0; // 0: request not initialized
    }

    open(method, url){ // specifies the request
        this.request_message = new Message();
        this.request_message.url = url;
        this.request_message.method = method;
    }

    send(body = {}){ // sends the request
        this.request_message.body = body;
        this.network.request(this);
    }

    set onload(callback){ // a callback function the FXMLHttpRequest will call once the response is received
        this.onload_func = callback;
    }

    get onload(){ // a callback function the FXMLHttpRequest will call once the response is received
        return this.onload_func;
    }
}

/**
 *  Singlton-like parameters - 
 *      access to the DB, Server and Network without creating new instances 
 *      with every generation of FXMLHttpRequest.
 */
var get_db = (() =>{
    const global_data_base = new DB();
    return () => {
        return global_data_base;
    };
}) ();

var get_server = (() =>{
    const global_server = new Server();
    return () => {
        return global_server;
    };
}) ();

var get_network = (() => {
    const global_network = new Network();
    return () => {
        return global_network;
    };
}) ();



/**
 * CLIENT code
 */

// var xhttp = new FXMLHttpRequest();



/**
 *  test for the DB class
 */


var test_POST_GET_users = () => {
    var db_access = get_db();
    if (!db_access.GET_users('TamarEdri')) log('test passed');

    if (db_access.POST_users('TamarEdri', '1234')) log('test passed');
    if (db_access.POST_users('TamarArbel', '5678')) log('test passed');

    if (db_access.GET_users('TamarEdri')) log('test passed');
    if (db_access.GET_users('TamarArbel')) log('test passed');
};

var test_POST_tasks = () =>{
    var db_access = get_db();
    db_access.POST_tasks('TamarEdri', '', '');  
    db_access.POST_tasks('TamarEdri', '', '');  
    db_access.POST_tasks('TamarArbel', '', '');

    if (!db_access.POST_tasks('Tamar', 'wrong task', 'wrong description')) log('test passed');  
    
};

var test_GET_tasks = () =>{
    var db_access = get_db();
    log(db_access.GET_tasks('TamarEdri'));  
    log(db_access.GET_tasks('TamarArbel'));

    log(db_access.GET_tasks('TamarEdri', 1));  
    log(db_access.GET_tasks('TamarArbel', 0));
    
    log(db_access.GET_tasks('TamarEdri', 3));  
    log(db_access.GET_tasks('TamarArbel', 1));
};

var test_PUT_tasks = () =>{
    var db_access = get_db();
    log(db_access.PUT_tasks('TamarEdri', 1, "fulstack project 02", 'a website with 2 video games.', undefined));  
    log(db_access.PUT_tasks('TamarEdri', 0, "fulstack project 03", "due TUE 9 in april..", true));  

    log(db_access.PUT_tasks('TamarArbel', 0, "test in algo", "finish studying a day in advance.", true));
};

var test_DELETE_tasks = () =>{
    var db_access = get_db();
    log(db_access.DELETE_tasks('TamarEdri', 0));  
};

var test_DB = () => {
    test_POST_GET_users();
    test_POST_tasks();
    test_GET_tasks();
    test_PUT_tasks();
    //test_DELETE_tasks();
};



/**
 * Client with SPA
 */


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

        return tbody;
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
            
            task_list_template.appendChild(
                task_list_init(response.body.tasks, task_list_template.getElementById("tasks-body")));

            
            container.innerHTML = ''; // Clear container
            container.appendChild(task_list_template);
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

