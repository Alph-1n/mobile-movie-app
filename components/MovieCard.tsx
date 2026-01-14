import { View, Text, TouchableOpacity,Image } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'
import { icons } from '@/constants/icons';

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
            <Text className='text-sm font-bold text-white mt-2 numberOfLines={1}'>{title}</Text>
            <View className='flex-row items-center   gap-1'><Image source={icons.star} className='w-4 h-4'/>
            <Text className='x-s text-white font-bold uppercase'>{Math.round(vote_average/2)}</Text></View>
            <View className='flex-row items-center justify-between'>
              <Text className='text-xs text-light-300 font-medium mt-1'>
                {release_date?.split('-')[0]}
              </Text>
              <Text className='text-xs text-light-300 font-medium uppercase'>Movie</Text>
            </View>
        </TouchableOpacity>
    </Link>
  )
}

export default MovieCard