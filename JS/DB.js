/**
 * Data Base implementation
 */

class DB {
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