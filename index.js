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
            status : 'in progress',
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

    PUT_tasks(username, taskid, description = undefined, note = undefined, status = undefined){
        var user_data = this.GET_users(username);
        if(!user_data || 
            taskid >= user_data.task_running_number || 
            !user_data.tasks[taskid].is_valid) 
            return false;
            
            
        var task = this.GET_tasks(username, taskid);

        if(description != undefined) task.description = description;
        if(note != undefined) task.note = note;
        if(status != undefined) task.status = status;

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

        var request_url = httpRequest.request_message.url.split('/');
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
                        if(2 > request_url.length > 3){
                            responsel.status = "400 Bad Request";
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
                                                    httpRequest.request_message.body.status)){
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
        parseDoneCallBack(httpRequest);
    }  
}


class Network{
    constructor(){
        this.server = get_server();
    }

    request(httpMessage){
        // randomly send 500 ERROR code - the server is not responding
        httpMessage.readyState = 1; // 1: server connection established
        if(Math.floor(Math.random() * 10) === 0){
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


/**
 * Test DB actions
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
    db_access.POST_tasks('TamarEdri', 'fulstack project 02', 'a website with 2 video games');  
    db_access.POST_tasks('TamarEdri', 'fulstack project 03', 'due TUE 9 in april..');  
    db_access.POST_tasks('TamarArbel', 'test in algo', 'finish studying a day in advance.');

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
    log(db_access.PUT_tasks('TamarEdri', 1, "", 'due TUE 9 in april.', ""));  
    log(db_access.PUT_tasks('TamarEdri', 0, "", "", "Done"));  

    log(db_access.PUT_tasks('TamarArbel', 0, "", "", 'Done'));
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
    test_DELETE_tasks();
};



/**
 * Client with SPA
 */

document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById('container');
    const loginTemplate = document.getElementById('login-template').content.cloneNode(true);
    const signupTemplate = document.getElementById('signup-template').content.cloneNode(true);

    // Function to load the signup form
    function loadSignupForm() {
        container.innerHTML = ''; // Clear container
        container.appendChild(signupTemplate);

        // Add event listener for "Login" link in the signup form
        const showLogin = document.getElementById('login-button'); //ok
        console.log(showLogin);
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            loadLoginForm(); // Load the login form
        });
    }

    // Function to load the login form
    function loadLoginForm() {
        container.innerHTML = ''; // Clear container
        container.appendChild(loginTemplate);
        
        // Add event listener for "Register" link in the login form
        const showSignup = document.getElementById('register-button'); //שגיאה הוא אומר שזה null??
        console.log(showSignup);
        showSignup.addEventListener('click', function() {
            loadSignupForm(); // Load the signup form
        });
    }

    // Show login form initially
    container.appendChild(loginTemplate);

    // Add event listener for "Register" link in the login form
    const showSignup = document.getElementById('register-button'); //ok
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        loadSignupForm(); // Load the signup form
    });

    //ok
    const loginButton = document.getElementById('loginSubmit'); 
    loginButton.addEventListener('click', function(e) {
        e.preventDefault();
        Login();
    });
});

function Login() {
    var username = document.getElementById("loginUsername").value;
    var password = document.getElementById("loginPassword").value;
    //get the user from the DB? or localStorage?

    if (true) //password === password from DB
    {
        currentUser = "TamarEdri";//username;
        LoadPersonalAreaPage()
    } 
}

var currentUser = "TamarEdri";

function Singup () {

}

function LoadPersonalAreaPage () {
    const container = document.getElementById('container');
    const PersonalAreaTemplate = document.getElementById('personal-area-template').content.cloneNode(true);
    container.innerHTML = ''; // Clear container
    container.appendChild(PersonalAreaTemplate);
    //get all the tasks from the DB
    var get_request = new FXMLHttpRequest();
    get_request.open('GET', "tasks/" + currentUser);
    get_request.onload = function () {
        var tbody = document.getElementById("tasks-body");
        get_request.response_message.body.tasks.forEach(task => {
            var table_data = document.getElementById("table-data").content.cloneNode(true);
            
            table_data.getElementById("description-area").innerText = task.description;

            table_data.getElementById("delete-button").addEventListener('click', () => DeleteTask(task.taskid) );
            table_data.getElementById("open-button").addEventListener('click', () => OpenTask(task.taskid));
            var button = table_data.getElementById("status-button");
            table_data.getElementById("status-button").addEventListener('click', () => UpdateStatus(task.taskid, task.status, button));
            tbody.appendChild(table_data);            
        });
    }
    get_request.send();
}

function OpenTask(taskid) {
    const container = document.getElementById('container');
    container.innerHTML = ''; // Clear container

    var get_request = new FXMLHttpRequest();
    get_request.open('GET', "tasks/" + currentUser + "/" + taskid);
    get_request.onload = function () {
        const SingelTaskTemplate = document.getElementById('single-task-template').content.cloneNode(true);
        var button = SingelTaskTemplate.getElementById("status-button");
        var task = get_request.response_message.body.tasks;
        SingelTaskTemplate.getElementById("status-button").addEventListener('click', () => UpdateStatus(task.taskid, task.status, button));
        SingelTaskTemplate.getElementById("update-button").addEventListener('click', () => UpdateTask(task.taskid) );
        SingelTaskTemplate.getElementById("description").innerText = task.description;
        SingelTaskTemplate.getElementById("note").innerText = task.note;
        container.appendChild(SingelTaskTemplate);
    }
    get_request.send();
}

function UpdateStatus(taskid, status, button) {
    var request = new FXMLHttpRequest();
    request.open('PUT', "tasks/" + currentUser + "/" + taskid);
    request.onload = function() {
        log(button);
        button.innerText = 'X';
    }
    request.send({status : "done" });    
}

function AddTask() { 
    var post_request = new FXMLHttpRequest();
    post_request.open('POST')
    //ליצור אובייקט הודעה או מחרוזת?
    //להוסיף כאן ID ?
    var task_data = "{description:" + document.getElementById("description").value + ",\nnote:" + document.getElementById("note").value + ",\nstate:" + document.getElementById("state").value + "\n}" ;
    post_request.open('POST', null, task_data);
    post_request.onload = function () { 
        LoadPersonalAreaPage();
    }
    post_request.send(task_data);
}

function UpdateTask(taskid) {
    var put_request = new FXMLHttpRequest(); 
    var put_request = "{description:" + document.getElementById("description").value + "\nnote:" + document.getElementById("note").value + "\nstate:" + document.getElementById("state").value + "\n}" ;
    put_request.open('PUT', null, task_updated_data);
    put_request.onload = function () {
        LoadPersonalAreaPage();
    }
    put_request.send(task_updated_data);
}

function DeleteTask(taskid) {
    var delete_request = new FXMLHttpRequest();
    delete_request.open('DELETE', /*מספר רץ? מאיפה?*/);
    delete_request.onload = function () {
        LoadPersonalAreaPage();
    }
    delete_request.send();
}

