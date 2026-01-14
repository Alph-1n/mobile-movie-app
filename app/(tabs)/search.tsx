import { View, Text,Image, FlatList,ActivityIndicator } from 'react-native'
import React from 'react'
import { images } from '@/constants/images'
import { icons } from '@/constants/icons'
import useFetch from '@/Services/useFetch'
import {useRouter} from 'expo-router'
import { fetchMovies } from '@/Services/api'
import MovieCard from '@/components/MovieCard'
import SearchBar from "@/components/SearchBar";

const search = () => {
  const [searchQuery,setSearchQuery]=React.useState('');
  
  const { 
    data: movies, 
    loading, 
    error 
  } = useFetch(() => fetchMovies({ query: searchQuery })); //tyoe inside '' to get the movies like iron man

  return (
    <View className='flex-1 bg-primary'>
      <Image source={images.bg} className='flex-1 absolute w-full z-0' resizeMode='cover'/>
      <FlatList 
      data={movies} 
      renderItem={({item}) => <MovieCard {...item} />}
      keyExtractor={(item) => item.id.toString()} 
      className='px-5'
      numColumns={3}
      columnWrapperStyle={{justifyContent: 'space-between',
                           gap:16,
                           marginVertical:16
                           }}
      contentContainerStyle={{paddingBottom:100}}
      ListHeaderComponent={
        <>
        <View className='w-full  flex-row justify-center mt-20'>
          <Image source={icons.logo} className='w-12 h-10'/>
        </View>
        <View>
          <SearchBar placeholder='Search Movies'
                     value={searchQuery}
                     onChangeText={(text:string)=>setSearchQuery(text)}/>
        </View>
        {loading && (
          <ActivityIndicator size='large' color='#0000ff' className='my-3'/>
        )}
        {error && (
          <Text className='text-red-500 px-5 py-3'>Error: {moviesError.message}</Text>
        )}
        {!loading && !error && searchQuery.trim() && movies?.length > 0 &&(
          <Text className='text-xl text-white font-bold'>
            Search result for {''}
            <Text className='text-accent'>SEARCH TERM</Text>
          </Text>
        )}
        </>            //<></>--empty react fraq
      }/>
    </View>
  )
}

export default search