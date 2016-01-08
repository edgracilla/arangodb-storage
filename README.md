# Couchbcase Storage Plugin

ArangoDB Storage Plugin for the Reekoh IoT Platform.

Uses arango npm library

**Assumptions:**

1. Data would be in JSON format
2. Data will be saved as is based on what has been sent
3. Data for edge collections will always have a valid _from and _to specified

**Process**

1. Data would be written directly to the ArangoDB host/port, collection type and collection specified
2. Storage plugin will only do insert data operations
3. All errors will be logged and no data should be written 
4. Bad Parameter, Invalid Document keys and Duplicate keys will still be logged but will not 
   cause the plugin to error out



##Sample Data

```
{
  _id: _id,
  co2: '11%',
  temp: 23,
  quality: 11.25,
  metadata: '{"name": "warehouse air conditioning"}',
  reading_time: '2015-11-27T11:04:13.539Z',
  random_data: 'abcdefg',
  is_normal: true
}
```


