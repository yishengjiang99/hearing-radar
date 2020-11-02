for f in `ls db/Fatboy*.js |grep -v ^$`;
do
  bs=${f##*/};
  name=${bs%.*}
  grep base64 $f |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\",' '\n'|grep -v ^$ |base64 --decode > mp3/$name.mp3;
done


