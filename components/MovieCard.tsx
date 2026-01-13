import { View, Text, TouchableOpacity,Image } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'

const MovieCard = ({id,poster_path,title,vote_average,release_date}:Movie) => {
    console.log(poster_path);
  return (
    <Link href={`/movies/${id}`} asChild>
        <TouchableOpacity className='w-[30%]'>
            <Image source={{
                uri:poster_path
                ? `https://image.tmdb.org/t/p/w500${poster_path}`
                : 'https://via.placeholder.com/600x400/1a1a1a/ffffff.png'
            }}
            className='w-full aspect-[2/3] rounded-lg'
            resizeMode='cover'/>
            <Text className='text-sm font-bold text-white mt-2'>{title}</Text>
        </TouchableOpacity>
    </Link>
  )
}

export default MovieCard