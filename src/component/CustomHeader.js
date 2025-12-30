import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    StatusBar,
    Platform,
    SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { appColors } from './Color';
import scaledSize from './scaleSize';


const CustomHeader = ({ title, navigation, rightIcon, rightIconPress }) => {
    return (
        <>
            {/* <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            /> */}
            <SafeAreaView style={{ backgroundColor: appColors.primary }}>
                <View style={styles.headerWrapper}>
                    <View style={styles.container}>
                        <View style={styles.leftSection}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Icon name="chevron-back-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {rightIcon &&
                            <View style={styles.rightContainer}>
                                <TouchableOpacity onPress={() => rightIconPress}>
                                    <Icon name={rightIcon} size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                </View>
            </SafeAreaView>

        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: appColors.primary,
    },
    headerWrapper: {
        backgroundColor: appColors.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    container: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        height: 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: appColors.white,
    },
    userName: {
        fontSize: 16,
        color: appColors.white,
        fontWeight: '600',
    },
    title: {
        fontWeight: '600',
        fontSize: 18,
        color: appColors.white,
        paddingEnd: scaledSize(20),
        fontFamily: 'Exo2-Bold',
        flex:5,
    }
});

export default CustomHeader;
