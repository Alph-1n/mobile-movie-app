import { View, Text,Image, FlatList,ActivityIndicator } from 'react-native'
import React from 'react'
import { images } from '@/constants/images'
import { icons } from '@/constants/icons'
import useFetch from '@/Services/useFetch'
import {useRouter} from 'expo-router'
import { fetchMovies } from '@/Services/api'
import MovieCard from '@/components/MovieCard'
import SearchBar from "@/components/SearchBar";

const saved = () => {
  return (
    <View className='flex-1 bg-primary'>
      <Image source={images.bg} className='flex-1 absolute w-full z-0' resizeMode='cover'/>
     </View>
  )
}

export default saved