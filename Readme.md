# learning backend
<hr>
this is a backend for video streaming website<br>
<hr>
This backend was made on node express and uses mongo db

## Routes
1. User routes "/api/v1/user"
    1. "/register" -registers the user required data:
        1. fullname - string required
        2. username - unique string required
        3. avatar - image required
        4. cover image - iamge
        5. password - required
        6. email - rerquired
    2. "/login" - logs in the user and provides the login tokens (access and refresh)
        1. email/username 
        2. password
        
    3. "/change-password"
        1. current
        2. new password
    
    
2. likes
3. comments
4. video

### to be continued
