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

    set content_type(content){
        this.content_type = content;
    }

    get content_type(){
        return this.content_type;
    }
}

class Server{
    constructor(){
        this.db_access = get_db();
    }


    parseMessage(message, parseDoneCallBack){
        // go the message fields - type Message
        var request = message.url.split('/');
        var body = JSON.parse(message.body);

        var response = new Message();
        response.status = "200 OK";

        switch (request[0]) {
            case 'users':
                
                switch (message.method) {
                    case 'GET':
                        // check credentials. if there was a false returned or wrong password - find an error with the request body.
                        if (request.length != 2) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var user_data = this.db_access.GET_users(request[1]);
                        
                        if(!user_data){
                            response.status = "404 Not Found"; // the user was not found
                            break;
                        }

                        if(user_data.password != body.password) {
                            response.status = "403 Forbidden"; // wrong password
                            break;
                        }

                        // ?? response.body = user_data; // the request is done.
                        break;
                        
                    case 'POST':
                        // store the user in the DB and return a code according to the result of the DB function. 
                        if (request.length != 1){
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
                switch (message.method) {
                    case 'GET':
                        // check if the get requests the entire list or just 1 task. 
                        // according to the return value of the DB - decied the code to return
                        if(2 > request.length > 3){
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        var taskid = -1;
                        if(request.length === 3) taskid = parseInt(request[2]);

                        var tasks = this.db_access.GET_tasks(request[1], taskid);
                        if(!tasks) {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        response.body = {'tasks' : tasks};

                        break;
                        
                    case 'POST':
                        if (request.length != 2) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.POST_tasks(request[1], body.description, body.note))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break; 

                    case 'PUT':
                        if (request.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized

                        if(!this.db_access.PUT_tasks(request[1], parseInt(request[2]), body.description, body.note, body.status))  {
                            response.status = "404 Not Found";
                            break;
                        } // the requested action could not be performed

                        break;

                    case 'DELETE':
                        if (request.length != 3) {
                            response.status = "400 Bad Request";
                            break;
                        } // the url was unrecognized
                        
                        if(!this.db_access.DELETE_tasks(request[1], parseInt(request[2])))  {
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
        parseDoneCallBack(response);
    }    
}


class Network{
    constructor(){
        this.server = get_server();
    }

    request(message, call_back){
        // randomly send 500 ERROR code - the server is not responding
        if(Math.floor(Math.random() * 3) === 0){
            var response_messag = new Message();
            response_messag.status = "503 Service Unavailable";

            call_back(response_messag);
        } else{
            this.response_call_back = call_back;
            this.server.parseMessage(message, this.response);
        }
    }

    response(message){
        this.response_call_back(message);
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
        this.network.request(this.request_message, receive_response);
        this.readyState = 3; //3: processing request
    }
    
    receive_response(message){ // callback function for the network to return its response.
        this.readyState = 4; //4: request finished and response is ready
        this.response_message = message;
        this.status = message.status;
        this.onload_func(); // define default function?
    }

    set onload(callback){ // a callback function the FXMLHttpRequest will call once the response is received
        this.onload_func = callback;
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
var db_access = get_db();

/**
 * Test DB actions
 */

var test_POST_GET_users = () => {
    if (!db_access.GET_users('TamarEdri')) log('test passed');

    if (db_access.POST_users('TamarEdri', '1234')) log('test passed');
    if (db_access.POST_users('TamarArbel', '5678')) log('test passed');

    if (db_access.GET_users('TamarEdri')) log('test passed');
    if (db_access.GET_users('TamarArbel')) log('test passed');
};

var test_POST_tasks = () =>{
    db_access.POST_tasks('TamarEdri', 'fulstack project 02', 'a website with 2 video games');  
    db_access.POST_tasks('TamarEdri', 'fulstack project 03', 'due TUE 9 in april..');  
    db_access.POST_tasks('TamarArbel', 'test in algo', 'finish studying a day in advance.');

    if (!db_access.POST_tasks('Tamar', 'wrong task', 'wrong description')) log('test passed');  
    
};

var test_GET_tasks = () =>{
    log(db_access.GET_tasks('TamarEdri'));  
    log(db_access.GET_tasks('TamarArbel'));

    log(db_access.GET_tasks('TamarEdri', 1));  
    log(db_access.GET_tasks('TamarArbel', 0));
    
    log(db_access.GET_tasks('TamarEdri', 3));  
    log(db_access.GET_tasks('TamarArbel', 1));
};

var test_PUT_tasks = () =>{
    log(db_access.PUT_tasks('TamarEdri', 1, "", 'due TUE 9 in april.', ""));  
    log(db_access.PUT_tasks('TamarEdri', 0, "", "", "Done"));  

    log(db_access.PUT_tasks('TamarArbel', 0, "", "", 'Done'));
};

var test_DELETE_tasks = () =>{
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
    console.log("hey8");

    // Function to load the signup form
    function loadSignupForm() {
        container.innerHTML = ''; // Clear container
        container.appendChild(signupTemplate);
        console.log("hey3");
        // Add event listener for "Login" link in the signup form
        const showLogin = document.getElementById('login-button'); //ok
        console.log(showLogin);
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("hey4");
            loadLoginForm(); // Load the login form
            console.log("hey5");
        });
    }

    // Function to load the login form
    function loadLoginForm() {
        container.innerHTML = ''; // Clear container
        container.appendChild(loginTemplate);
        console.log("hey1");
        
        // Add event listener for "Register" link in the login form
        const showSignup = document.getElementById('register-button'); //שגיאה הוא אומר שזה null??
        console.log(showSignup);
        showSignup.addEventListener('click', function() {
            console.log("hey10");
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
    console.log("in login");
    var username = document.getElementById("loginUsername").value;
    var password = document.getElementById("loginPassword").value;
    //get the user from the DB? or localStorage?

    if (true) //password === password from DB
    {
        LoadPersonalAreaPage()
    } 
}

function Singup () {

}

function LoadPersonalAreaPage () {
    const container = document.getElementById('container');
    const PersonalAreaTemplate = document.getElementById('personal-area-template').content.cloneNode(true);
    container.innerHTML = ''; // Clear container
    container.appendChild(PersonalAreaTemplate);
    //get all the tasks from the DB
    var get_request = new FXMLHttpRequest();
    get_request.open('GET', "users");
    get_request.onload = function () {
        //bring the tasks to the area
        // לולאת הזרקה לטבלה?
    }
    get_request.send();
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

function editTask() {
    var put_request = new FXMLHttpRequest(); 
    var put_request = "{description:" + document.getElementById("description").value + "\nnote:" + document.getElementById("note").value + "\nstate:" + document.getElementById("state").value + "\n}" ;
    put_request.open('PUT', null, task_updated_data);
    put_request.onload = function () {
        LoadPersonalAreaPage();
    }
    put_request.send(task_updated_data);
}

function DeleteTask() {
    var delete_request = new FXMLHttpRequest();
    delete_request.open('DELETE', /*מספר רץ? מאיפה?*/);
    delete_request.onload = function () {
        LoadPersonalAreaPage();
    }
    delete_request.send();
}

