var connection=require('../connection');
var jwt=require('jsonwebtoken');
var cryptojs=require('crypto-js');
var path=require('path');
var FCM=require('fcm-node');
var serverKey='AIzaSyB4ogdCdxlC8jpYXjS9fjcF5KWSVXQ101I';

function User(){

    this.getUser=function(userObj,res){
        connection.acquire(function(err,con){
            con.query('select username,password,id from patient where username=?',[userObj.username],function(err,result){
                con.release();
                if(err){
                    res.send("fail");
                }else{
                    var userData=JSON.stringify(result);
                    var encrypt=cryptojs.AES.encrypt(userData,'clinic28262').toString();
                    var token=jwt.sign({
                        token:encrypt
                    },'jwtHS256');
                    if(token){
                        res.header('Auth',token).send({
                            'status':'Login Successfull',
                            'token':token,
                            'id':result[0].id
                        });
                    }else{
                        res.status(401).send();
                    }
                }
            });
        });
    };

    this.createUser=function(userObj,res){
        connection.acquire(function(err,con){
            var sql=con.query('insert into patient set ?',[userObj],function(err,result){
                con.release();
                if(err){
                    res.send("failed");
                }
                else{
                    res.render('adminhome.ejs');
                }
            });
        });
    };

    this.getAllUsers=function(res){
        connection.acquire(function(err,con){
            con.query('select * from patient',function(err,result){
                if(err){
                    res.send("An error occured");
                }else{
                    var data = {"data":result};
                    res.send(data);
                }
            });
        });
    };

    this.getQuestions=function(res){
        connection.acquire(function(err,con){
            con.query('SELECT result.id,result.section,result.question,result.optionsize,adoptions.adoptions FROM adoptions RIGHT OUTER JOIN (SELECT question.id,question.section,question.question,options.optionsize FROM question INNER JOIN options ON question.optionid=options.optionid) AS result ON adoptions.id=result.id ORDER BY result.id ASC',function(err,result){
                if(err){
                    res.send("Error retrieving questions");
                }else{
                    var response={};
                    response["result"]=result;
                    res.send(response);
                }
            });
        });
    };

    this.getAdmin=function(req,res){
        //console.log(adminObj.username,adminObj.password);
        var adminObj = req.body;
        var clinic_session = req.session;
        connection.acquire(function(err,con){
            var sql=con.query('select username,password from admin where username=? AND password=?',[adminObj.username,adminObj.password],function(err,result){
                con.release();
                console.log(result);
                var message = {};
                if(err){
                    res.send("Error Occured.Please try again later");
                }else if(result.length==0){
                    message['status'] = "Invalid Username or Password";
                    message['code'] = 0;
                    res.render('clinic.ejs',message);
                }
                else{
                    clinic_session.username = result[0]['username'];
                    message['status'] = "success";
                    message['code'] = 1;
                    message['username'] = result[0]['username'];
                    res.render('adminhome.ejs',{'message':message});
                }
            });
        });
    };

    this.sendAnswer=function(ansObj,res){
        connection.acquire(function(err,con){
            var sql=con.query('insert into answer(id,medication,diet,physical,smoking,weight,alcohol)values(?,?,?,?,?,?,?)',[ansObj.id,ansObj.medication,ansObj.diet,ansObj.physical,ansObj.smoking,ansObj.weight,ansObj.alcohol],function(err,result){
                if(err){
                    res.send(sql.sql);
                }else{
                    res.send("Successfully posted");
                }
            });
        });
    };

    this.getAnswer=function(ansId,res){
        connection.acquire(function(err,con){
            var uId;
            con.query('select id from patient where username=?',[ansId.username],function(err,result){
                if(err){
                    //res.send('Error Occured');
                }else{
                    console.log(result);
                    uId=result[0].id;
                    console.log(uId);
                    con.query('select medication,diet,physical,smoking,weight,alcohol from answer where id=?',[uId],function(err,result){
                        if(err){
                            //res.send('Error Occured');
                        }else{
                            var answer = result;
                            var section = ["Physical Activity","Diet","Alcohol","Smoking","Medication Usage"];
                            var mod_section = ["physical","diet","alcohol","smoking","medication"];
                            var questionObj={};

                            for(var i=0;i<section.length;i++){
                                console.log(section[i]);
                                con.query('SELECT * FROM question where section=?',[section[i]],function(err,result){
                                    if(err){
                                        //console.log(err);
                                        //console.log("hi");
                                    }else{
                                        var values = answer[0][mod_section[this.i]].split(",");
                                        //console.log(values);
                                        //console.log(this.i);
                                        //console.log(answer[0][mod_section[this.i]]);
                                        questionObj[mod_section[this.i]] = [];
                                        for(var k =0;k<result.length;k++){
                                            result[k]['response'] = values[k];
                                            questionObj[mod_section[this.i]].push(result[k]);
                                        }


                                    }
                                    //console.log(questionObj);
                                    if(this.i==4){
                                        console.log(questionObj);
                                        res.send(questionObj);
                                    }
                                }.bind({i:i}));
                            }
                            //res.send(result);
                        }
                    });
                }
            });

        });
    };

    this.getAnswerObject=function(ansId,res){
        connection.acquire(function(err,con){
            var uId;
            con.query('select id from patient where username=?',[ansId.username],function(err,result){
                if(err){
                    //res.send('Error Occured');
                }else{
                    console.log(result);
                    uId=result[0].id;
                    //console.log(uId);
                    con.query('select medication,diet,physical,smoking,weight,alcohol from answer where id=?',[uId],function(err,result){
                        if(err){
                            res.send('Error Occured');
                        }else{
                            res.send(result);
                        }
                    });
                }
            });

        });
    };

    this.registerDevice=function(devObj,res){
        connection.acquire(function(err,con){
            con.query('insert into device(id,token) values(?,?)',[devObj.id,devObj.token],function(err,result){
                if(err){
                    res.send('error occurred.Please try again');
                }else{
                    res.send("Updated successfully");
                }
            });
        });
    };

    this.getRequests = function(devObj,res){
        connection.acquire(function(err,con){
            con.query('select * from device where flag=?',["false"],function(err,result){
                if(err){
                    res.send('error occurred.Please try again');
                }else{
                    var data = {"data":result};
                    res.send(data);
                }
            });
        });
    };

    this.getDevice=function(devObj,res){
        connection.acquire(function(err,con){
            con.query('select id,token from device where id=?',[devObj.id],function(err,result){
                if(err){
                    console.log('failed');
                    res.send('Error Occurred. Please try again!');
                }else{
                    console.log(result);
                    var sql=con.query('update device SET flag=? where id=?',["true",devObj.id],function(err,result1){
                        if(err){
                            console.log(sql.sql);
                            res.send('Error Occurred.Please try again');
                        }else{
                            console.log(sql.sql);
                            res.send('Successfully Updated');
                        }
                    });
                }
            });
        });
    };

    this.getAllDevices=function(res){
        connection.acquire(function(err,con){
            con.query('select * from device where flag="true"',function(err,result){
                if(err){
                    res.send('Error Occurred. Please try again!');
                }else{
                    res.send(result);
                }
            });
        });
    };

    this.push=function(userObj,res){
        var fcmCli = new FCM(serverKey);

        var content="Username: "+userObj.username+"Password: "+userObj.password;
        var payload = {
            to : userObj.token,
            priority : 'high',
            notification: {
                title : 'Clinic App',
                body :content
            }
        };
        fcmCli.send(payload, function (err, result) {
            if(err){
                console.error(err);
                res.status(400).send({'status':'Unable to send the notification'});
            }else{
                console.log(result);
                connection.acquire(function(err,con){
                    var sql=con.query('update device SET flag="false" where id=?',[userObj.id],function(err,result1){
                        if(err){
                            console.log(sql.sql);
                            console.log(err);
                            res.send('Error Occurred.Please try again!');
                        }else{
                            res.send('Message sent to the user!');
                        }
                    });
                });
            }
        });
    };

}
module.exports=new User();
