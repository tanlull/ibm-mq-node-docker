'use strict';
/*
  Copyright (c) IBM Corporation 2017

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

   Contributors:
     Mark Taylor - Initial Contribution
*/

/*
 * This is an example of a Node.js program to put messages to an IBM MQ
 * queue.
 *
 * The queue and queue manager name can be given as parameters on the
 * command line. Defaults are coded in the program.
 *
 * A single message is put, containing a "hello" and timestamp.
 * Each MQI call prints its success or failure.
 *
 * This program also demonstrates how authentication can be achieved with
 * a userid/password option.
 */

// Import the MQ package
require('dotenv').config();
var mq = require('ibmmq');
var MQC = mq.MQC; // Want to refer to this export directly for simplicity

// The queue manager and queue to be used. These can be overridden on command line.
var qMgr = process.env.QMGR;
var qName = process.env.QUEUE_NAME;

function formatErr(err) {
  return  "MQ call failed in " + err.message;
}

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}

// Define some functions that will be used from the main flow
function putMessage(hObj) {

  var msg = "Hello from Node at " + new Date();

  var mqmd = new mq.MQMD(); // Defaults are fine.
  var pmo = new mq.MQPMO();

  // Describe how the Put should behave
  pmo.Options = MQC.MQPMO_NO_SYNCPOINT |
                MQC.MQPMO_NEW_MSG_ID |
                MQC.MQPMO_NEW_CORREL_ID;

  mq.Put(hObj,mqmd,pmo,msg,function(err) {
    if (err) {
      console.log(formatErr(err));
    } else {
      console.log("MsgId: " + toHexString(mqmd.MsgId));
      console.log("Msg: " + msg);
      console.log("MQPUT successful");
    }
  });
}

// When we're done, close queues and connections
function cleanup(hConn,hObj) {
  mq.Close(hObj, 0, function(err) {
    if (err) {
      console.log(formatErr(err));
    } else {
      console.log("MQCLOSE successful");
    }
    mq.Disc(hConn, function(err) {
      if (err) {
        console.log(formatErr(err));
      } else {
        console.log("MQDISC successful");
      }
    });
  });
}

// The program really starts here.
// Connect to the queue manager. If that works, the callback function
// opens the queue, and then we can put a message.

console.log("Sample AMQSPUT.JS start");

// Get command line parameters
var myArgs = process.argv.slice(2); // Remove redundant parms
if (myArgs[0]) {
  qName = myArgs[0];
}
if (myArgs[1]) {
  qMgr  = myArgs[1];
}

var cno = new mq.MQCNO();
cno.Options = MQC.MQCNO_NONE; // use MQCNO_CLIENT_BINDING to connect as client


  var csp = new mq.MQCSP();
  csp.UserId = process.env.APP_USER;
  csp.Password = process.env.APP_PASSWORD;
  cno.SecurityParms = csp;

  // And use the MQCD to programatically connect as a client
// First force the client mode
cno.Options |= MQC.MQCNO_CLIENT_BINDING;
// And then fill in relevant fields for the MQCD
var cd = new mq.MQCD();
cd.ConnectionName = `${process.env.HOST}(${process.env.PORT})`;
cd.ChannelName = process.env.CHANNEL;
// Make the MQCNO refer to the MQCD
cno.ClientConn = cd;

mq.Connx(qMgr, cno, function(err,hConn) {
   if (err) {
     console.log(formatErr(err));
   } else {
     console.log("MQCONN to %s successful ", qMgr);

     // Define what we want to open, and how we want to open it.
     var od = new mq.MQOD();
     od.ObjectName = qName;
     od.ObjectType = MQC.MQOT_Q;
     var openOptions = MQC.MQOO_OUTPUT;
     mq.Open(hConn,od,openOptions,function(err,hObj) {
       if (err) {
         console.log(formatErr(err));
       } else {
         console.log("MQOPEN of %s successful",qName);
         putMessage(hObj);
       }
       cleanup(hConn,hObj);
     });
   }
});
