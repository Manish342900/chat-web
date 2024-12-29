import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"

export const signup=  async(req,res)=>{
    const{fullName,email,password}=req.body
    
    
    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All Credentianls Are Requires"})
       }

        if (password.length<6){
            return res.status(400).json({message:"password must be at least 6 characters"});
        }

        const user=await User.findOne({email})

        if (user) return res.status(400).json({message:"Email already exists"})

        const salt = await bcrypt.getSalt(10)

        const hashedPassword=await bcrypt.hash(password,salt)

        const newUser= new User({
            fullName:fullName,
            email:email,
            password:hashedPassword
        })

        if(newUser){
            generateToken(newUser._id,res)
            await newUser.save(),

            res.status(201).json({
                _id:newUser._id,
                fullName: newUser.fullName,
                email:newUser.email,
                profilePic: newUser.profilePic
            })
        }else{
            res.status(400).json({message:"Invalid user data"})
        }


    }catch(error){
        console.log("Error in signup controller", error.message)
        res.status(500).json({message:"Inrernal server Error"})
    }
}

export const login= async (req,res)=>{
    const {email,password}=res.body
    
    try{
        const user=await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        const isPasswordCorrect=await bcrypt.compare(password,user.password)

        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid Credentatials"})
        }

        generateToken(user._id,res)
        res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email:user.email,
            profilePic: user.profilePic

        })
    }catch(error){
        console.log("Error in login Credential ",error.message)
        res.status(500).json({message:"interval server Error"})
    }
}

export const logout= (req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"logout Succesful"})
    }catch(error){
        console.log("Error in logout credenetianls",error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const updateProfile=async(req,res)=>{
    try {
        const {profilePic}=req.body
        const userId=req.user._id

        if(!profilePic){
            return res.status(400).json({message:"profile pic is requires"})
        }

        const uploadResponse=await cloudinary.uploader.upload(profilePic)
        const updateUser=await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true})

        res.status(200).json(updateUser)
    } catch (error) {
        console.log("Error in update profile",error.message)
        res.status(500).json({message:"internal Error"})
    }
}

export const checkAuth =(req,res)=>{
    try{
        res.status(200).json(req.user);
    }catch(error){
        console.log("Error in checkAuth Contorller",error.message)
        res.status(500).json({message:"inernal server error"})
    }
}