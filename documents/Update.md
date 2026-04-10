THis is update plane roadmap
why this plane becuase now when select the teaching topic and send the topic to GPT-4o it take long time to get the result , and the student will not like it
SO the plane is to order each Schema alone

also we have problem in the page of ai-teacher, every thing is displayed under one tab where we have ready tabs upper, so we will fix this also

first I want you review why we have UnifiedSmartTeachingInterface.tsx and EnhancedSmartLearningCanvas.tsx, see both have video EnhancedVideoPlayer , as I saw we have the tabs in UnifiedSmartTeachingInterface and agin we create with EnhancedSmartLearningCanvas a new tabs including video

now as step one:
see ai-old.txt and see first generateContent . how we call gpt-4o to get generateProgressiveContent , I want this to get the Required Content and the text subject only 
then show text using textformater , I think we can do it direct using UnifiedSmartTeachingInterface.tsx not EnhancedSmartLearningCanvas.tsx then while student redaing text which forrmated using textformater , we can get video link after suring video is one of the selected content and then get the other selected content one by one

the files that should be reviewd and modified 
1- [locale]/student/ai-teacher/page.txt
2- '@/components/UnifiedSmartTeachingInterface'
3- @/smart-teaching/EnhancedSmartLearningCanvas - may we delete this file and do all the work from UnifiedSmartTeachingInterface - check
4- /api/smart-teaching/generate-content/routs  -now it has some errors to be fixed becuase we change the old ai-content-generator to ai-old.ts
5- "@/lib/smart-teaching/ai-content-generator  should review at same foleder the ai-old which was the old ai-content-generator which was getting all contint at same time 


now under this first step make our roadmap to do the fixes, also if the upper text should be updted or fixed or reformat to be good prompt for all ai tools do it.