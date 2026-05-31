# Secure-Online-Clipboard

This is a secure online clipboard application. This would be very helpful if we need to transfer the data from one device to another in a secure way and the data should not last permanently.

Front End: HTML, CSS, JS
Back End: Node.JS
Database Used: MongoDB Atlas

# Features:
1. Each clipboard has a unique 12 - digit ID
2. We can set a password for each clipboard
3. Users can set the custom TTL based deletion of the clipboard content in the database
4. Users can set the custom read count and custom wrong password count (They also have a choice not to choose this)
5. Passwords are hashed before storing in the database
6. Messages are encrypted before storing in the database
7. There is a feedback page to tell the feedback to the developer
8. Help Page to understand how to use this website and see the Privacy Policy and Terms of Service of this website
9. Users can copy the generated clipboard ID and the retreived content to the clipboard in the computer
10. Users can download the retreived content as a text file (.txt file)
11. Welcome Page and Page Not Found Page are also present

# Versions:
*Ver 1.0.0*: It is the basic version of the project that contains all the above features. But user has to calculate the TTL in seconds and enter it. Users can enter upto 1000 characters per clipboard.  
*Ver 1.0.1*: This is the second version of this project. The issue of user calculating the time needed and entering it in seconds has been resolved by letting the user to enter the required hours, minutes and seconds and the time in seconds has been calculated from that by the website itself. The character limit per clipboard has been increased from 1000 to 2500.
