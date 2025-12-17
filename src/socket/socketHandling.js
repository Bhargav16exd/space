import { json } from "stream/consumers";
import { io } from "../app.js";
import { Space } from "../models/space.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import ErrorResponse from "../utils/error.response.js";
import SuccessResponse from "../utils/success.response.js";


export const spaceData = {} 

export const latest = async (req,res,next) => {

    try {
        
        const {space} = req.body

        if(!space){
            throw new ErrorResponse(400,"Invalid Space Name")
        }

        if( !spaceData[space] ||spaceData[space].content){
            return res.json(new SuccessResponse(200,"Fetched Latest Data",spaceData[space]))
        }

        //Procceed further only for spaces which are archived

        const uniqueSpace = await Space.findOne({name:space})
 
        if(!uniqueSpace){
            return res.json( new  SuccessResponse(400, "No Such Space Exist"))
        }

        const responseBoilerPlate = {
            content : uniqueSpace.content,
            count : spaceData[space].count
        }


        return res.json(new SuccessResponse(200,"Fetched Latest Data",responseBoilerPlate))

    } catch (error) {
        next(error)
    }
}

export default async function ListenToSocket(){


    /*
    Title   : Auth Middleware
    Working : Check if user is logged in ,
              logged in -> yes -> user = username
              logged in -> no  -> user = Guest 
    */
    io.use(async(socket,next)=>{

        try {

            const token = socket.handshake.auth.token 

    
            if(!token){
              socket.user = "Guest";
              return next()
            }
    
            const validatedUser = jwt.verify(token,process.env.JWT_SECRET)

                    
            if(!validatedUser){
                throw new ErrorResponse(400,"Unauthenticated")
            }
            
            const user = await User.findById(validatedUser._id)
            
            if(!user){
               throw new ErrorResponse(500,"Internal Server Error")
            }
            
            socket.user = user
            next()

        } catch (error) {
            console.log(error)   
        }
    })

    
    io.on("connection", async (socket) => {

        const {space} = socket.handshake.query
        const {role}  = socket.handshake.query


        // Get Space Detials associated with space data provided by user
        const spaceDetailsFetchedFromDatabase = await Space.findOne({
            name:space
        })


        /*
          Working : If user tries to access space which doesnt exist in database throw an error
        */
        if(!spaceDetailsFetchedFromDatabase){
            socket.emit("err","no-space-found")
        }
        else{

            socket.join(space)

            /* 
                Working : Whenever a space is created create a key of that object
            */
            if(spaceData[space]){
                spaceData[space] = spaceData[space]
            }
            else{
                spaceData[space] = {content:'',count:''}
            }

            //Count Number of People
            const count = io.sockets.adapter.rooms.get(space).size

            /*
                Working : Send Content and count on First hand when user joins
            */
           spaceData[space].count = count

            socket.to(space).emit("user-joined",count)

        }

        /*
          Working : It Allows only person who created room to emit message to the room 
        */
        
        socket.on("chat",(msg)=>{

            const {content} = msg
            
            socket.to(space).emit("chat",parseContent(content))

            /* 
               Working : Store Data In RAM
               NOTE : optimizaiton required
            */

            if(parseContent(content)[0]){
                spaceData[space].content = parseContent(content)
            }            

        })
       

       //When Socket disconnects
        socket.on("disconnect", () => {

            const count = io.sockets?.adapter.rooms.get(space)?.size
            
            if(count){
                socket.to(space).emit("user-joined",count)
            }
            
        });


    })

}

export const parseContent = (content) => {
    const parsedContent = content.map((item) => {
        return {
            id: item.id,
            data: item.data,
        };
    });

    return parsedContent;
}

const logger = ({role,socketId}) =>{

    if(role == 'Space Master'){
      console.log(`Space Master Connected `,socketId)
    }
    else if(role == 'Joinee'){
      console.log(`Joinee Connected `,socketId)
    }
}