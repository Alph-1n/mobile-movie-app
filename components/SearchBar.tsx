import { View, Text,Image, TextInput } from 'react-native'
import React from 'react'
import { icons } from '@/constants/icons'

interface Props {
    placeholder:string;
    onPress?:()=>void;
    value?:string;
    onChangeText?:(text:string)=>void;
}

const SearchBar = ({placeholder,onPress,value,onChangeText}:Props) => {
  return (
    <View className='"flex-row items-center bg-dark-200 rounded-full px-4 py-4'>
      <Image source={icons.search} className='size-5' resizeMode='contain' tintColor='#ab8bff'/>
      < TextInput 
      onPress={onPress}
      placeholder={placeholder}
      value=''
      onChangeText={onChangeText}
      placeholderTextColor='#a8b5db'
      className='fkex-1 ml-2 text-white'/>    </View>
  )
}

export default SearchBar